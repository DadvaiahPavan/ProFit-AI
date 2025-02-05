from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
import bcrypt
import os
from dotenv import load_dotenv
from functools import wraps
import logging
import sys
import json
from groq import Groq

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log', encoding='utf-8')
    ]
)
logger = logging.getLogger('app')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure database
logger.debug(f"Database URL: {os.getenv('DATABASE_URL', 'sqlite:///instance/workout_planner.db')}")
if os.getenv('VERCEL_ENV') == 'production':
    # Use PostgreSQL for production
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
else:
    # Use SQLite for development
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///instance/workout_planner.db')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Set secret key
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key')
logger.debug(f"Secret Key Set: {bool(app.secret_key)}")

# Initialize database
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.LargeBinary, nullable=False)
    workout_plans = db.relationship('WorkoutPlan', backref='user', lazy=True)
    diet_plans = db.relationship('DietPlan', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.email}>'

    def set_password(self, password):
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password)

class WorkoutPlan(db.Model):
    __tablename__ = 'workout_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_content = db.Column(db.Text, nullable=False)
    preferences = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class DietPlan(db.Model):
    __tablename__ = 'diet_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_content = db.Column(db.Text, nullable=False)
    preferences = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login first.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def generate_workout_plan(preferences):
    try:
        groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        logger.debug("Initializing Groq client")
        
        prompt = f"""Generate a detailed workout plan based on the following preferences:
        {preferences}
        
        The plan should be formatted in HTML with the following structure:
        
        <div class="workout-plan-content">
            <div class="section">
                <h3>Warm-up Routine (10-15 minutes)</h3>
                <ul>
                    [List warm-up exercises with duration/reps]
                </ul>
            </div>
            
            <div class="section">
                <h3>Main Workout</h3>
                <ul>
                    [List exercises with sets, reps, and rest periods]
                </ul>
            </div>
            
            <div class="section">
                <h3>Cool-down Routine (10-15 minutes)</h3>
                <ul>
                    [List cool-down exercises with duration]
                </ul>
            </div>
            
            <div class="section">
                <h3>Weekly Schedule</h3>
                <ul>
                    [List workout schedule for each day]
                </ul>
            </div>
            
            <div class="section">
                <h3>Form Tips & Notes</h3>
                <ul>
                    [List important form tips and notes]
                </ul>
            </div>
        </div>
        
        Make sure to include specific exercises, sets, reps, and rest periods. Format all lists and sections properly in HTML."""

        logger.debug("Sending request to Groq API")
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional fitness trainer creating personalized workout plans. Always format the response in clean HTML with proper sections and styling classes."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=1024
        )
        logger.debug("Received response from Groq API")

        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Error generating workout plan: {str(e)}", exc_info=True)
        raise

def generate_diet_plan(preferences):
    try:
        groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        logger.debug("Initializing Groq client")
        
        prompt = f"""Generate a detailed 7-day diet plan based on the following preferences:
        {preferences}
        
        The plan should be formatted in HTML with the following structure:
        
        <div class="diet-plan-content">
            <div class="section">
                <h3>Daily Nutritional Goals</h3>
                <ul>
                    <li>Total Calories: [Value]</li>
                    <li>Protein: [Value]g ([Percentage]%)</li>
                    <li>Carbohydrates: [Value]g ([Percentage]%)</li>
                    <li>Fats: [Value]g ([Percentage]%)</li>
                </ul>
            </div>
            
            <div class="section">
                <h3>Meal Schedule</h3>
                <div class="meal-times">
                    <ul>
                        <li>Breakfast: [Time]</li>
                        <li>Lunch: [Time]</li>
                        <li>Dinner: [Time]</li>
                        <li>Snacks: [Times]</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h3>7-Day Meal Plan</h3>
                <div class="weekly-plan">
                    <!-- Day 1 -->
                    <div class="day-plan">
                        <h4>Day 1</h4>
                        <div class="meal">
                            <h5>Breakfast</h5>
                            <ul>
                                <li>[Meal item 1] ([calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat)</li>
                                <li>[Meal item 2] ([calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat)</li>
                            </ul>
                        </div>
                        <div class="meal">
                            <h5>Lunch</h5>
                            <ul>
                                <li>[Meal item 1] ([calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat)</li>
                                <li>[Meal item 2] ([calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat)</li>
                            </ul>
                        </div>
                        <div class="meal">
                            <h5>Dinner</h5>
                            <ul>
                                <li>[Meal item 1] ([calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat)</li>
                                <li>[Meal item 2] ([calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat)</li>
                            </ul>
                        </div>
                        <div class="meal">
                            <h5>Snacks</h5>
                            <ul>
                                <li>[Snack 1] ([calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat)</li>
                                <li>[Snack 2] ([calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat)</li>
                            </ul>
                        </div>
                    </div>
                    <!-- Repeat the same structure for Days 2-7 -->
                </div>
            </div>
            
            <div class="section">
                <h3>Hydration Guidelines</h3>
                <ul>
                    <li>Daily water intake goal: [Value] liters</li>
                    <li>Tips for staying hydrated throughout the day</li>
                </ul>
            </div>
            
            <div class="section">
                <h3>Additional Notes</h3>
                <ul>
                    <li>Important dietary tips and guidelines</li>
                    <li>Food preparation suggestions</li>
                    <li>Meal timing recommendations</li>
                </ul>
            </div>
        </div>"""

        logger.debug("Sending request to Groq API")
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional nutritionist creating personalized diet plans. Always format the response in clean HTML with proper sections and styling classes. Make sure to provide complete information for all 7 days."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=4096  # Increased token limit
        )
        logger.debug("Received response from Groq API")

        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Error generating diet plan: {str(e)}", exc_info=True)
        raise

# Create all database tables
with app.app_context():
    try:
        db.create_all()
        logger.info("Database tables created successfully!")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")

# Routes
@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/home')
@login_required
def home():
    return render_template('landing.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    try:
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            
            if not email or not password:
                flash('Please provide both email and password', 'error')
                return redirect(url_for('login'))
            
            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                session['user_id'] = user.id
                flash('Login successful!', 'success')
                return redirect(url_for('app_home'))  # Redirect to app_home instead of home
            
            flash('Invalid email or password', 'error')
            logger.warning(f"Failed login attempt for email: {email}")
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        flash('An error occurred during login. Please try again.', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    try:
        if request.method == 'POST':
            email = request.form.get('email')
            username = request.form.get('username')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')

            if not all([email, username, password, confirm_password]):
                flash('All fields are required', 'error')
                return redirect(url_for('register'))

            if password != confirm_password:
                flash('Passwords do not match', 'error')
                return redirect(url_for('register'))

            if User.query.filter_by(email=email).first():
                flash('Email already registered', 'error')
                return redirect(url_for('register'))

            if User.query.filter_by(username=username).first():
                flash('Username already taken', 'error')
                return redirect(url_for('register'))

            user = User(email=email, username=username)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()

            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        flash('An error occurred during registration. Please try again.', 'error')

    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('landing'))

@app.route('/workout', methods=['GET', 'POST'])
def workout():
    if 'user_id' not in session:
        flash('Please login first', 'error')
        return redirect(url_for('login'))

    if request.method == 'POST':
        try:
            preferences = {
                'fitness_level': request.form.get('fitness_level'),
                'goal': request.form.get('goal'),
                'equipment': request.form.get('equipment'),
                'time_available': request.form.get('time_available'),
                'target_areas': request.form.getlist('target_areas')
            }
            
            workout_plan = generate_workout_plan(preferences)
            
            # Save to database
            new_plan = WorkoutPlan(
                user_id=session['user_id'],
                plan_content=workout_plan,
                preferences=json.dumps(preferences)
            )
            db.session.add(new_plan)
            db.session.commit()
            
            flash('Workout plan generated successfully!', 'success')
            return render_template('workout.html', plan=workout_plan)
            
        except Exception as e:
            logger.error(f"Error in workout route: {str(e)}")
            flash('Error generating workout plan. Please try again.', 'error')
            
    return render_template('workout.html')

@app.route('/diet', methods=['GET', 'POST'])
def diet():
    if 'user_id' not in session:
        flash('Please login first', 'error')
        return redirect(url_for('login'))

    if request.method == 'POST':
        try:
            preferences = {
                'goal': request.form.get('goal'),
                'dietary_restrictions': request.form.getlist('dietary_restrictions'),
                'allergies': request.form.get('allergies'),
                'current_weight': request.form.get('current_weight'),
                'target_weight': request.form.get('target_weight'),
                'activity_level': request.form.get('activity_level')
            }
            
            diet_plan = generate_diet_plan(preferences)
            
            # Save to database
            new_plan = DietPlan(
                user_id=session['user_id'],
                plan_content=diet_plan,
                preferences=json.dumps(preferences)
            )
            db.session.add(new_plan)
            db.session.commit()
            
            flash('Diet plan generated successfully!', 'success')
            return render_template('diet.html', plan=diet_plan)
            
        except Exception as e:
            logger.error(f"Error in diet route: {str(e)}")
            flash('Error generating diet plan. Please try again.', 'error')
            
    return render_template('diet.html')

@app.route('/app')
def app_home():
    if 'user_id' not in session:
        flash('Please login first', 'error')
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        flash('User not found', 'error')
        return redirect(url_for('login'))
    
    return render_template('app.html', user=user)

if __name__ == '__main__':
    app.run(debug=True)
