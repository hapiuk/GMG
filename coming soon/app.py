from flask import Flask, send_from_directory, render_template, url_for

app = Flask(__name__)

# Route to serve the SSL verification file
@app.route('/.well-known/pki-validation/<path:filename>')
def well_known(filename):
    return send_from_directory('.well-known/pki-validation', filename)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return url_for('static', filename='media/images/favicon.ico')

if __name__ == '__main__':
    app.run(debug=True)
