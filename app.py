from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_mail import Mail, Message
import pandas as pd
import os
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


app = Flask(__name__)

# ----------------- Flask-Mail Configuration -----------------
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'princebist40@gmail.com'
app.config['MAIL_PASSWORD'] = 'vabz chzy ckit xqhp'  # App password from Gmail
mail = Mail(app)

# ----------------- File Upload Setup -----------------
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global variables
selected_template_name = "default"
certificate_status_log = []  # Stores status for /status.html

# ----------------- Certificate Generator -----------------
def generate_certificate(name, course, date, template_name):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter 

    # --- Background Image (Fixed for all templates) ---
    try:
        bg_path = "static/certificate_backgrounds/certificate_bg.png"
        background = ImageReader(bg_path)
        c.drawImage(background, 0, 0, width=width, height=height)
    except Exception as e:
        print(f"[ERROR] Could not load background image: {e}")

    # --- Shared Header ---
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 100, "Certificate of Completion")

    # --- Template-Specific Layouts ---
    if template_name == "classic":
        c.setFont("Times-Roman", 20)
        c.drawCentredString(width / 2, height - 160, "Presented to")
        c.setFont("Times-Bold", 26)
        c.drawCentredString(width / 2, height - 200, name)

        c.setFont("Times-Italic", 18)
        c.drawCentredString(width / 2, height - 250, "For successfully completing")
        c.drawCentredString(width / 2, height - 280, course)

        c.setFont("Times-Italic", 14)
        c.drawCentredString(width / 2, height - 320, f"Date: {date}")

    elif template_name == "modern":
        c.setFont("Helvetica-Bold", 16)
        c.setFillColorRGB(0.2, 0.4, 0.6)
        c.rect(50, height - 140, width - 100, 2, fill=1)

        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica", 22)
        c.drawCentredString(width / 2, height - 180, f"Awarded to {name}")

        c.setFont("Helvetica", 16)
        c.drawCentredString(width / 2, height - 220, "For successful completion of")
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(width / 2, height - 250, course)

        c.setFont("Helvetica", 14)
        c.drawCentredString(width / 2, height - 290, f"Date: {date}")

    elif template_name == "corporate":
        c.setFont("Courier-Bold", 24)
        c.setFillColorRGB(0, 0.2, 0.4)
        c.drawCentredString(width / 2, height - 170, name)

        c.setFont("Courier", 16)
        c.setFillColorRGB(0, 0, 0)
        c.drawCentredString(width / 2, height - 210, "has successfully completed the")
        c.drawCentredString(width / 2, height - 240, course)
        c.drawCentredString(width / 2, height - 270, f"on {date}")

    else:  # Default/fallback
        c.setFont("Helvetica", 20)
        c.drawCentredString(width / 2, height - 180, f"Presented to {name}")
        c.setFont("Helvetica", 16)
        c.drawCentredString(width / 2, height - 220, f"For completing {course}")
        c.drawCentredString(width / 2, height - 260, f"Date: {date}")

    # Footer (optional)
    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.drawString(30, 30, f"Template: {template_name}")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer

# ----------------- Routes -----------------
@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/get_dashboard_stats', methods=['GET'])
def get_dashboard_stats():
    total = len(certificate_status_log)
    sent = len([entry for entry in certificate_status_log if entry['status'] == 'sent'])
    failed = len([entry for entry in certificate_status_log if entry['status'] == 'failed'])

    return jsonify(success=True, stats={
        'total_sent': sent,
        'total_failed': failed,
        'total_uploads': total,
        'templates': 4  # or make dynamic if needed
    })


@app.route('/login.html')
def login():
    return render_template('login.html')

@app.route('/dashboard.html')
def dashboard():
    return render_template('dashboard.html')

@app.route('/templates.html')
def templates():
    return render_template('templates.html')

@app.route('/customize.html')
def customize():
    return render_template('customize.html')

@app.route('/status.html')
def status():
    return render_template('status.html')

@app.route('/upload.html')
def upload():
    return render_template('upload.html')

@app.route('/select_template', methods=['POST'])
def select_template_route():
    global selected_template_name
    data = request.get_json()
    selected_template_name = data.get('templateName')
    print(f"[INFO] Template selected: {selected_template_name}")
    return jsonify(success=True, message=f"Template '{selected_template_name}' selected.")

@app.route('/upload_data', methods=['POST'])
def upload_data():
    if 'file' not in request.files:
        return jsonify(success=False, message='No file part in request.'), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify(success=False, message='No file selected.'), 400

    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        print(f"[DEBUG] File saved at: {filepath}")

        # Read file
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(filepath)
        elif file.filename.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(filepath, engine='openpyxl')
        else:
            return jsonify(success=False, message='Unsupported file format.'), 400

        # Clean and normalize
        df = df.loc[:, ~df.columns.str.match('^Unnamed')]
        df = df.dropna(axis=1, how='all')
        df.columns = [col.strip().lower() for col in df.columns]

        required_columns = ['student name', 'email address', 'course/program', 'completion date']
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            return jsonify(success=False, message=f'Missing required columns: {", ".join(missing)}'), 400

        df = df.rename(columns={
            'student name': 'Student Name',
            'email address': 'Email Address',
            'course/program': 'Course/Program',
            'completion date': 'Completion Date'
        })

        response = jsonify(success=True, data=df.to_dict(orient='records'), record_count=len(df))
        print("[DEBUG] JSON Response:", response.get_data(as_text=True))
        return response

    except Exception as e:
        print(f"[ERROR] File processing failed: {e}")
        return jsonify(success=False, message=f'Error processing file: {str(e)}'), 500

@app.route('/send_certificates', methods=['POST'])
def send_certificates():
    data = request.get_json()
    students = data.get('students', [])
    global selected_template_name

    if not students:
        return jsonify(success=False, message="No student data provided."), 400
    if not selected_template_name:
        return jsonify(success=False, message="No template selected."), 400

    sent_count = 0
    failed_count = 0
    results = []

    for student in students:
        name = student.get('Student Name')
        email = student.get('Email Address')
        course = student.get('Course/Program')
        date = student.get('Completion Date')

        if not all([name, email, course, date]):
            result = {'name': name, 'email': email, 'course': course, 'date': date, 'status': 'failed', 'reason': 'Missing data'}
            results.append(result)
            certificate_status_log.append(result)
            failed_count += 1
            continue

        try:
            # Generate certificate PDF
            pdf_buffer = generate_certificate(name, course, date, selected_template_name)

            msg = Message(
                subject=f"Your Certificate for {course}",
                sender=app.config['MAIL_USERNAME'],
                recipients=[email]
            )
            msg.body = (
                f"Dear {name},\n\n"
                f"Congratulations on completing the {course} on {date}.\n"
                f"Please find your certificate attached.\n\n"
                f"Regards,\nEDC Club Team BIST Bhopal"
            )

            msg.attach(f"Certificate_{name.replace(' ', '_')}.pdf", "application/pdf", pdf_buffer.read())
            mail.send(msg)

            result = {'name': name, 'email': email, 'course': course, 'date': date, 'status': 'sent'}
            results.append(result)
            certificate_status_log.append(result)
            sent_count += 1

        except Exception as e:
            print(f"[ERROR] Failed to send to {email}: {e}")
            result = {'name': name, 'email': email, 'course': course, 'date': date, 'status': 'failed', 'reason': str(e)}
            results.append(result)
            certificate_status_log.append(result)
            failed_count += 1

    return jsonify(success=True, total=len(students), sent=sent_count, failed=failed_count, results=results)

# ----------------- NEW: Return Certificate Status -----------------
@app.route('/get_status_log', methods=['GET'])
def get_status_log():
    return jsonify(success=True, data=certificate_status_log)

# ----------------- Run Server -----------------
if __name__ == '__main__':
    app.run(debug=True)
