from flask import Flask, render_template, request, redirect, url_for, flash
from flask_mail import Mail, Message

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Required for flash messages

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.yourmailserver.com'  # Example: smtp.gmail.com
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your_email@example.com'
app.config['MAIL_PASSWORD'] = 'your_email_password'
app.config['MAIL_DEFAULT_SENDER'] = ('Your Name or Company', 'your_email@example.com')

mail = Mail(app)

@app.route('/send_email', methods=['POST'])
def send_email():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')

        if not name or not email or not message:
            flash('All fields are required!', 'error')
            return redirect(url_for('index.html'))

        # Create the email message
        msg = Message(subject=f"New Contact Form Submission from {name}",
                      recipients=['recipient@example.com'],  # Change this to your receiving email address
                      body=f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}")

        try:
            mail.send(msg)
            flash('Message sent successfully!', 'success')
        except Exception as e:
            print(e)
            flash('An error occurred while sending your message. Please try again later.', 'error')

        return redirect(url_for('index.html'))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return url_for('static', filename='media/images/favicon.ico')

if __name__ == '__main__':
    app.run(debug=True)
