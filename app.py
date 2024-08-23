from flask import Flask, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired
from flask_wtf.csrf import CSRFProtect
import os

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'your_default_secret_key')

# Define the path for the database file in the static folder
db_path = os.path.join(app.root_path, 'static', 'site.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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

# Define the Post model
class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)

# Function to create a default user (Delete before push to LIVE)
def create_default_user():
    if User.query.count() == 0:
        default_user = User(
            username='admin',
            password=generate_password_hash('GoblinsAreReal123!'),  # Default password
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

@app.route('/')
def index():
    posts = Post.query.order_by(Post.id.desc()).all()  # Retrieve all posts, ordered by newest first
    return render_template('index.html', posts=posts)

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
        post = Post(title=form.title.data, content=form.content.data)
        db.session.add(post)
        db.session.commit()
        flash('Post created successfully!', 'success')
        return redirect(url_for('dashboard'))

    posts = Post.query.all()
    return render_template('dashboard.html', form=form, posts=posts)

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
    db.session.delete(post)
    db.session.commit()
    flash('Post deleted successfully!', 'success')
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    app.run(debug=True)
