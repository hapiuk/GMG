from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField, HiddenField
from wtforms.validators import DataRequired, Email, ValidationError
from flask_mail import Mail, Message
from flask_wtf.csrf import CSRFProtect
from datetime import datetime
import os
import random

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'your_default_secret_key')

# Define the path for the database file in the static folder
db_path = os.path.join(app.root_path, 'static', 'site.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.office365.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'aaron.gomm@outlook.com'  
app.config['MAIL_PASSWORD'] = 'buxqzdwnlmqppice'
app.config['MAIL_DEFAULT_SENDER'] = ('Aaron Gomm', 'aaron.gomm@outlook.com')

mail = Mail(app)

# Configure upload folder
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')

db = SQLAlchemy(app)
csrf = CSRFProtect(app)

# Define the User model with the necessary columns
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    contact_number = db.Column(db.String(20))
    position = db.Column(db.String(100))
    location = db.Column(db.String(100))

# Define the Media model
class Media(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    media_type = db.Column(db.String(50), nullable=False)  # 'image' or 'video'
    media_url = db.Column(db.String(200), nullable=False)  # URL or path to the media

# Define the Post model
class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    author = db.Column(db.String(100), nullable=False)
    media = db.relationship('Media', backref='post', lazy=True)

# Function to create a default user (Delete before push to LIVE)
def create_default_user():
    if User.query.count() == 0:
        default_user = User(
            username='admin',
            password=generate_password_hash('GoblinsAreReal123!', method='pbkdf2:sha256'),  # Default password
            email='aaron.gomm@outlook.com',
            contact_number='07360079461',
            position='IT Systems and Website',
            location='Tamworth'
        )
        db.session.add(default_user)
        db.session.commit()
        print("Default user created.")

# Create the database and tables on app startup
with app.app_context():
    db.create_all()
    create_default_user()

# Define the LoginForm
class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = StringField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

# Define the PostForm
class PostForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    content = TextAreaField('Content', validators=[DataRequired()])
    submit = SubmitField('Create Post')


# Define contact form feilds
class ContactForm(FlaskForm):
    band_name = StringField('Band Name', validators=[DataRequired()])
    band_contact = StringField('Band Contact', validators=[DataRequired()])
    email = StringField('Email Address', validators=[DataRequired(), Email()])
    band_social = StringField('Band Social(s)', validators=[DataRequired()])
    message = TextAreaField('Message', validators=[DataRequired()])
    user_captcha_response = StringField('What is the answer to the question?', validators=[DataRequired()])
    captcha_answer = HiddenField('CAPTCHA Answer')  # Hidden field for CAPTCHA answer
    submit = SubmitField('Send Message')

def generate_captcha():
    # Example simple math CAPTCHA
    num1 = random.randint(1, 10)
    num2 = random.randint(1, 10)
    question = f"What is {num1} + {num2}?"
    answer = str(num1 + num2)  # Ensure it's a string to match form field types
    return question, answer

@app.route('/', methods=['GET', 'POST'])
def index():
    form = ContactForm()

    if request.method == 'GET':
        # Generate a CAPTCHA question and store it in the form object
        form.captcha_question, form.captcha_answer.data = generate_captcha()

    if form.validate_on_submit():
        # Validate CAPTCHA
        if form.user_captcha_response.data != form.captcha_answer.data:
            flash('CAPTCHA validation failed. Please try again.', 'danger')
            return redirect(url_for('index', _anchor='contact-section'))

        # Proceed with form processing
        band_name = form.band_name.data
        band_contact = form.band_contact.data
        email = form.email.data
        band_social = form.band_social.data
        message_body = form.message.data

        msg = Message('New Contact Form Submission',
                      sender=app.config['MAIL_DEFAULT_SENDER'],
                      recipients=[app.config['MAIL_USERNAME']])
        msg.body = f"""
        Band Name: {band_name}
        Band Contact: {band_contact}
        Email Address: {email}
        Band Social(s): {band_social}

        Message:
        {message_body}
        """
        try:
            mail.send(msg)
            flash('Message sent successfully!', 'success')
        except Exception as e:
            print(e)
            flash('Error sending message. Please try again later.', 'danger')
        
        return redirect(url_for('index', _anchor='contact-section'))

    posts = Post.query.order_by(Post.date_posted.desc()).all()
    posts_data = [
        {
            'title': post.title,
            'content': post.content,
            'date_posted': post.date_posted.strftime('%Y-%m-%d %H:%M:%S'),
            'author': post.author,
            'media': [{'media_type': media.media_type, 'media_url': media.media_url} for media in post.media]
        } for post in posts
    ]
    
    return render_template('index.html', posts=posts_data, form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            session['user'] = user.username
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')

    return render_template('login.html', form=form)

@app.route('/logout')
def logout():
    session.pop('user', None)
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if 'user' not in session:
        flash('Please log in to access this page.', 'error')
        return redirect(url_for('login'))

    form = PostForm()
    if form.validate_on_submit():
        post = Post(title=form.title.data, content=form.content.data, author=session['user'])
        db.session.add(post)
        db.session.commit()

        media_files = request.files.getlist('media_files')

        if media_files:
            image_count = 0
            video_count = 0

            for media_file in media_files:
                if 'image' in media_file.content_type and image_count < 3:
                    filename = secure_filename(media_file.filename)
                    media_type = 'image'
                    image_count += 1
                elif 'video' in media_file.content_type and video_count < 1:
                    filename = secure_filename(media_file.filename)
                    media_type = 'video'
                    video_count += 1
                else:
                    continue  # Skip if limits are exceeded

                media_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                if not os.path.exists(app.config['UPLOAD_FOLDER']):
                    os.makedirs(app.config['UPLOAD_FOLDER'])

                media_file.save(media_path)

                media = Media(post_id=post.id, media_type=media_type, media_url=filename)
                db.session.add(media)

            db.session.commit()

        flash('Post created successfully!', 'success')
        return redirect(url_for('dashboard'))

    posts = Post.query.order_by(Post.date_posted.desc()).all()  # Ensure newest posts are on top
    total_posts = Post.query.count()
    total_users = User.query.count()
    return render_template('dashboard.html', form=form, posts=posts, total_posts=total_posts, total_users=total_users)

@app.route('/edit_post/<int:post_id>', methods=['POST'])
def edit_post(post_id):
    if 'user' not in session:
        flash('Please log in to access this page.', 'error')
        return redirect(url_for('login'))

    post = Post.query.get_or_404(post_id)
    post.title = request.form['title']
    post.content = request.form['content']
    db.session.commit()
    flash('Post updated successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/delete_post/<int:post_id>', methods=['POST'])
def delete_post(post_id):
    if 'user' not in session:
        flash('Please log in to access this page.', 'error')
        return redirect(url_for('login'))

    post = Post.query.get_or_404(post_id)

    # First, delete all related media entries
    Media.query.filter_by(post_id=post_id).delete()

    # Now, delete the post itself
    db.session.delete(post)
    db.session.commit()
    flash('Post deleted successfully!', 'success')
    return redirect(url_for('dashboard'))


@app.route('/edit_page_content', methods=['POST'])
def edit_page_content():
    # Implement the logic to edit page content
    flash('Page content updated successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/create_post', methods=['POST'])
def create_post():
    title = request.form['title']
    content = request.form['content']
    author = session['user']

    post = Post(title=title, content=content, author=author)
    db.session.add(post)
    db.session.commit()

    media_files = request.files.getlist('media_files')

    # Ensure there are files to process
    if media_files and any(f.filename for f in media_files):
        # Ensure the upload folder exists
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])

        for media_file in media_files:
            if media_file and media_file.filename != '':
                filename = secure_filename(media_file.filename)
                media_type = 'image' if 'image' in media_file.content_type else 'video'
                media_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                media_file.save(media_path)

                media = Media(post_id=post.id, media_type=media_type, media_url=f"uploads/{filename}")
                db.session.add(media)

    db.session.commit()
    flash('Post created successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)
