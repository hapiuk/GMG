from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, jsonify, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField, HiddenField
from wtforms.validators import DataRequired, Email
from flask_mail import Mail, Message
from flask_wtf.csrf import CSRFProtect
from datetime import datetime
import os
import random

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'your_default_secret_key')

# Configure database
db_path = os.path.join(app.root_path, 'static', 'site.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Flask-Mail (dummy config, will be overridden by DB settings)
app.config['MAIL_SERVER'] = 'smtp.office365.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = ''
app.config['MAIL_PASSWORD'] = ''
app.config['MAIL_DEFAULT_SENDER'] = ('', '')

mail = Mail(app)

# Configure upload folder
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')

# Initialize extensions
db = SQLAlchemy(app)
csrf = CSRFProtect(app)

# Flag to ensure tables are created only once
tables_created = False

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    contact_number = db.Column(db.String(20))
    position = db.Column(db.String(100))
    location = db.Column(db.String(100))

class Media(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    media_type = db.Column(db.String(50), nullable=False)
    media_url = db.Column(db.String(200), nullable=False)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    author = db.Column(db.String(100), nullable=False)
    media = db.relationship('Media', backref='post', lazy=True)

class AboutUs(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

class GameSection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    section_id = db.Column(db.Integer, unique=True)
    header_image_url = db.Column(db.String(255), nullable=True)
    summary_text = db.Column(db.Text, nullable=True)
    video_url = db.Column(db.String(255), nullable=True)
    gallery = db.relationship('GameMedia', backref='section', lazy=True)  # Ensure the backref name is unique

class GameMedia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_url = db.Column(db.String(255), nullable=False)
    media_type = db.Column(db.String(50), nullable=False)
    game_section_id = db.Column(db.Integer, db.ForeignKey('game_section.id'), nullable=False)
    # Relationship is now defined in GameSection, no need for a duplicate relationship here

class MovieSection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    header_image_url = db.Column(db.String(255), nullable=True)
    summary_text = db.Column(db.Text, nullable=True)
    video_url = db.Column(db.String(255), nullable=True)
    gallery = db.relationship('MovieMedia', backref='movie_section', lazy=True)

class MovieMedia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    media_url = db.Column(db.String(255), nullable=False)
    media_type = db.Column(db.String(50), nullable=False)
    movie_section_id = db.Column(db.Integer, db.ForeignKey('movie_section.id'), nullable=False)

class EmailSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mail_server = db.Column(db.String(255), nullable=False)
    mail_port = db.Column(db.Integer, nullable=False)
    mail_username = db.Column(db.String(255), nullable=False)
    mail_password = db.Column(db.String(255), nullable=False)
    mail_use_tls = db.Column(db.Boolean, default=True)
    mail_use_ssl = db.Column(db.Boolean, default=False)
    default_sender_name = db.Column(db.String(255), nullable=False)
    default_sender_email = db.Column(db.String(255), nullable=False)

# Forms
class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = StringField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class PostForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    content = TextAreaField('Content', validators=[DataRequired()])
    submit = SubmitField('Create Post')

class ContactForm(FlaskForm):
    band_name = StringField('Band Name', validators=[DataRequired()])
    band_contact = StringField('Band Contact', validators=[DataRequired()])
    email = StringField('Email Address', validators=[DataRequired(), Email()])
    band_social = StringField('Band Social(s)', validators=[DataRequired()])
    message = TextAreaField('Message', validators=[DataRequired()])
    user_captcha_response = StringField('What is the answer to the question?', validators=[DataRequired()])
    captcha_answer = HiddenField('CAPTCHA Answer')
    submit = SubmitField('Send Message')

class EmailSettingsForm(FlaskForm):
    mail_server = StringField('Mail Server', validators=[DataRequired()])
    mail_port = StringField('Mail Port', validators=[DataRequired()])
    mail_username = StringField('Email Username', validators=[DataRequired()])
    mail_password = StringField('Email Password', validators=[DataRequired()])
    mail_use_tls = StringField('Use TLS (True/False)', validators=[DataRequired()])
    mail_use_ssl = StringField('Use SSL (True/False)', validators=[DataRequired()])
    default_sender_name = StringField('Default Sender Name', validators=[DataRequired()])
    default_sender_email = StringField('Default Sender Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Update Settings')

def generate_captcha():
    num1 = random.randint(1, 10)
    num2 = random.randint(1, 10)
    question = f"What is {num1} + {num2}?"
    answer = str(num1 + num2)
    return question, answer

def create_default_user():
    if User.query.count() == 0:
        default_user = User(
            username='admin',
            password=generate_password_hash('GoblinsAreReal123!', method='pbkdf2:sha256'),
            email='aaron.gomm@outlook.com',
            contact_number='07360079461',
            position='IT Systems and Website',
            location='Tamworth'
        )
        db.session.add(default_user)
        db.session.commit()
        print("Default user created.")

def get_email_settings():
    settings = EmailSettings.query.first()
    if settings:
        app.config['MAIL_SERVER'] = settings.mail_server
        app.config['MAIL_PORT'] = settings.mail_port
        app.config['MAIL_USERNAME'] = settings.mail_username
        app.config['MAIL_PASSWORD'] = settings.mail_password
        app.config['MAIL_USE_TLS'] = settings.mail_use_tls
        app.config['MAIL_USE_SSL'] = settings.mail_use_ssl
        app.config['MAIL_DEFAULT_SENDER'] = (settings.default_sender_name, settings.default_sender_email)
        
        # Reinitialize the mail object after loading settings
        global mail
        mail = Mail(app)

def send_email(msg):
    try:
        with mail.connect() as conn:  # Manually connect to the mail server
            conn.send(msg)  # Send the message
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({'success': False, 'message': 'Error sending message. Please try again later.'})

@app.before_request
def before_request():
    global tables_created
    if not tables_created:
        db.create_all()
        tables_created = True
    get_email_settings()

# Application Routes
@app.route('/', methods=['GET', 'POST'])
def index():
    # Fetch the 'About Us' content from the database
    about_us_content = AboutUs.query.first()
    if not about_us_content:
        about_us_content = {'text': '', 'image_url': ''}

    # Fetch the movie section content
    movie_section = MovieSection.query.first()

    # Initialize the contact form
    form = ContactForm()

    # Handle the GET request by generating a new CAPTCHA
    if request.method == 'GET':
        form.captcha_question, form.captcha_answer.data = generate_captcha()
    
    # Handle the POST request
    if request.method == 'POST':
        if not form.validate_on_submit():
            # Return a JSON response with form validation errors
            return jsonify({'success': False, 'message': 'Form validation failed. Please check your inputs.'}), 400

        # CAPTCHA validation
        if form.user_captcha_response.data != form.captcha_answer.data:
            return jsonify({'success': False, 'message': 'CAPTCHA validation failed. Please try again.'}), 400

        # Extract form data
        band_name = form.band_name.data
        band_contact = form.band_contact.data
        email = form.email.data
        band_social = form.band_social.data
        message_body = form.message.data

        # Prepare the email message
        msg = Message(
            'New Contact Form Submission',
            sender=app.config['MAIL_DEFAULT_SENDER'],
            recipients=[app.config['MAIL_USERNAME']]
        )
        msg.body = f"""
        Band Name: {band_name}
        Band Contact: {band_contact}
        Email Address: {email}
        Band Social(s): {band_social}

        Message:
        {message_body}
        """

        # Attempt to send the email
        try:
            mail.send(msg)
            return jsonify({'success': True, 'message': 'Message sent successfully!'}), 200, {'Content-Type': 'application/json'}
        except Exception as e:
            # Log the exception for debugging
            app.logger.error(f"Error sending email: {e}")
            return jsonify({'success': False, 'message': 'Error sending message. Please try again later.'}), 500

    # If it's not a form submission (GET request or invalid form), continue rendering the page
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

    # Fetch game sections and their associated media
    game_section_1 = GameSection.query.filter_by(section_id=1).first()
    if game_section_1:
        game_section_1_media = GameMedia.query.filter_by(game_section_id=game_section_1.id, media_type='video').first()
        if game_section_1_media:
            game_section_1.video_url = game_section_1_media.media_url
    
    game_section_2 = GameSection.query.filter_by(section_id=2).first()
    game_section_3 = GameSection.query.filter_by(section_id=3).first()
    game_section_4 = GameSection.query.filter_by(section_id=4).first()
    
    return render_template('index.html', 
                           posts=posts_data, 
                           about_us_content=about_us_content, 
                           form=form,
                           movie_section=movie_section,
                           game_section_1=game_section_1,
                           game_section_2=game_section_2,
                           game_section_3=game_section_3,
                           game_section_4=game_section_4)


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

    # Fetch current game sections and About Us content
    game_section_1 = GameSection.query.filter_by(section_id=1).first()
    game_section_2 = GameSection.query.filter_by(section_id=2).first()
    game_section_3 = GameSection.query.filter_by(section_id=3).first()
    game_section_4 = GameSection.query.filter_by(section_id=4).first()
    about_us_content = AboutUs.query.first()
    movie_section = MovieSection.query.first()

    # Fetch the current email settings from the database
    email_settings = EmailSettings.query.first()

    # Create form instances
    post_form = PostForm()
    email_settings_form = EmailSettingsForm()

    # Populate the email settings form with current settings if they exist
    if email_settings:
        email_settings_form.mail_server.data = email_settings.mail_server
        email_settings_form.mail_port.data = email_settings.mail_port
        email_settings_form.mail_username.data = email_settings.mail_username
        email_settings_form.mail_password.data = email_settings.mail_password  # Store password as plain text
        email_settings_form.mail_use_tls.data = str(email_settings.mail_use_tls)
        email_settings_form.mail_use_ssl.data = str(email_settings.mail_use_ssl)
        email_settings_form.default_sender_name.data = email_settings.default_sender_name
        email_settings_form.default_sender_email.data = email_settings.default_sender_email

    posts = Post.query.order_by(Post.date_posted.desc()).all()
    total_posts = Post.query.count()
    total_users = User.query.count()

    if post_form.validate_on_submit():
        post = Post(title=post_form.title.data, content=post_form.content.data, author=session['user'])
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
                    continue

                media_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                if not os.path.exists(app.config['UPLOAD_FOLDER']):
                    os.makedirs(app.config['UPLOAD_FOLDER'])

                media_file.save(media_path)

                media = Media(post_id=post.id, media_type=media_type, media_url=filename)
                db.session.add(media)

            db.session.commit()

        flash('Post created successfully!', 'success')
        return redirect(url_for('dashboard'))

    posts = Post.query.order_by(Post.date_posted.desc()).all()
    total_posts = Post.query.count()
    total_users = User.query.count()

    return render_template('dashboard.html', 
                           post_form=post_form, 
                           email_settings_form=email_settings_form,
                           posts=posts, 
                           total_posts=total_posts, 
                           total_users=total_users, 
                           about_us_content=about_us_content,
                           game_section_1=game_section_1,
                           game_section_2=game_section_2,
                           game_section_3=game_section_3,
                           game_section_4=game_section_4,
                           movie_section=movie_section)


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
    Media.query.filter_by(post_id=post_id).delete()
    db.session.delete(post)
    db.session.commit()
    flash('Post deleted successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/edit_page_content', methods=['POST'])
def edit_page_content():
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

    if media_files and any(f.filename for f in media_files):
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

@app.route('/edit_about_us', methods=['POST'])
def edit_about_us():
    about_text = request.form.get('about_text')
    about_image = request.files.get('about_image')
        
    about_us_content = AboutUs.query.first()
    if about_us_content:
        existing_image_url = about_us_content.image_url
    else:
        existing_image_url = None

    if about_image and about_image.filename != '':
        filename = secure_filename(about_image.filename)
        about_image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        image_url = url_for('uploaded_file', filename=filename)
    else:
        image_url = existing_image_url

    if about_us_content:
        about_us_content.text = about_text
        about_us_content.image_url = image_url
    else:
        about_us_content = AboutUs(text=about_text, image_url=image_url)
        db.session.add(about_us_content)

    db.session.commit()
    flash('The "About Us" section has been updated successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/edit_movie_section', methods=['POST'])
def edit_movie_section():
    movie_section = MovieSection.query.first()

    if not movie_section:
        movie_section = MovieSection()
        db.session.add(movie_section)
        db.session.commit()

    video = request.files.get('movie_video')

    if video:
        filename = secure_filename(video.filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        video.save(video_path)
        movie_section.video_url = url_for('uploaded_file', filename=filename)
        
        # Save the video URL to the database
        db.session.commit()

    flash('Movie Section updated successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/edit_game_section/<int:section_id>', methods=['POST'])
def edit_game_section(section_id):
    game_section = GameSection.query.filter_by(section_id=section_id).first()

    if not game_section:
        game_section = GameSection(section_id=section_id)
        db.session.add(game_section)
        db.session.commit()  # Commit here to ensure the game_section has an ID

    header_image = request.files.get('section_header_image')
    summary_text = request.form.get('section_summary_text')
    gallery_files = request.files.getlist('section_gallery')

    if header_image:
        filename = secure_filename(header_image.filename)
        header_image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        game_section.header_image_url = url_for('uploaded_file', filename=filename)

    if summary_text:
        game_section.summary_text = summary_text

    if gallery_files:
        for media_file in gallery_files:
            filename = secure_filename(media_file.filename)
            media_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            new_media = GameMedia(media_url=url_for('uploaded_file', filename=filename), media_type='image', game_section_id=game_section.id)
            db.session.add(new_media)

    db.session.commit()
    flash(f'Game Section {section_id} updated successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    settings = EmailSettings.query.first()
    form = EmailSettingsForm()

    if request.method == 'GET' and settings:
        # Pre-populate the form with the current settings from the database
        form.mail_server.data = settings.mail_server
        form.mail_port.data = settings.mail_port
        form.mail_username.data = settings.mail_username
        form.mail_password.data = settings.mail_password
        form.mail_use_tls.data = str(settings.mail_use_tls)
        form.mail_use_ssl.data = str(settings.mail_use_ssl)
        form.default_sender_name.data = settings.default_sender_name
        form.default_sender_email.data = settings.default_sender_email

    if form.validate_on_submit():
        if settings is None:
            settings = EmailSettings(
                mail_server=form.mail_server.data,
                mail_port=form.mail_port.data,
                mail_username=form.mail_username.data,
                mail_password=form.mail_password.data,
                mail_use_tls=form.mail_use_tls.data == 'True',
                mail_use_ssl=form.mail_use_ssl.data == 'True',
                default_sender_name=form.default_sender_name.data,
                default_sender_email=form.default_sender_email.data
            )
            db.session.add(settings)
        else:
            settings.mail_server = form.mail_server.data
            settings.mail_port = form.mail_port.data
            settings.mail_username = form.mail_username.data
            settings.mail_password = form.mail_password.data
            settings.mail_use_tls = form.mail_use_tls.data == 'True'
            settings.mail_use_ssl = form.mail_use_ssl.data == 'True'
            settings.default_sender_name = form.default_sender_name.data
            settings.default_sender_email = form.default_sender_email.data

        db.session.commit()
        flash('Email settings updated successfully!', 'success')
        return redirect(url_for('dashboard'))

    return render_template('dashboard.html', 
                           post_form=PostForm(), 
                           email_settings_form=form, 
                           game_section_1=GameSection.query.filter_by(section_id=1).first(),
                           game_section_2=GameSection.query.filter_by(section_id=2).first(),
                           game_section_3=GameSection.query.filter_by(section_id=3).first(),
                           game_section_4=GameSection.query.filter_by(section_id=4).first(),
                           about_us_content=AboutUs.query.first())

if __name__ == '__main__':
    app.run(debug=True)
