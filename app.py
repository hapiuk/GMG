from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return url_for('static', filename='media/images/favicon.ico')

if __name__ == '__main__':
    app.run(debug=True)
