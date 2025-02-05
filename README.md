# ProFit-AI: Personalized Fitness and Nutrition Assistant

ProFit-AI is an advanced web application that leverages AI to create personalized workout and diet plans tailored to individual needs and preferences. Built with Flask and powered by the Groq AI model, it provides detailed, science-based fitness and nutrition guidance.

## 🌟 Features

### Personalized Workout Plans
- Custom exercise routines based on fitness level and goals
- Detailed warm-up and cool-down instructions
- Proper form guidance and tips
- Weekly schedule planning
- Progressive overload recommendations
- Downloadable workout plans

### Customized Diet Plans
- 7-day meal plans with complete nutritional information
- Macronutrient distribution
- Meal timing recommendations
- Portion control guidance
- Dietary restriction accommodations (Vegetarian, Non-Vegetarian, Vegan)
- Hydration guidelines
- Downloadable diet plans

### User Management
- Secure user authentication
- Personal profile management
- Plan history tracking
- Progress monitoring

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask 2.3.3
- **Database**: SQLAlchemy 3.0.5
- **Authentication**: Bcrypt 4.0.1
- **AI Integration**: Groq API 0.4.2
- **API Security**: Python-Jose 3.3.0

### Frontend
- **HTML5/CSS3**: Modern, responsive design
- **JavaScript**: Dynamic user interactions
- **Bootstrap**: Responsive UI components
- **Custom CSS**: Glassmorphic design elements
- **Font Awesome**: Modern icons

### Security Features
- Password hashing with Bcrypt
- Session management
- CORS protection
- Environment variable configuration
- SQL injection prevention

## 📋 Prerequisites

- Python 3.8+
- Groq API key
- Modern web browser
- Internet connection

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ProFit-AI.git
cd ProFit-AI
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the root directory with:
```env
GROQ_API_KEY=your_groq_api_key
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///instance/workout_planner.db
```

5. Initialize the database:
```bash
flask db upgrade
```

6. Run the application:
```bash
flask run
```

## 🎯 Usage

1. **Registration/Login**
   - Create a new account or log in to existing account
   - Provide basic information for personalized recommendations

2. **Workout Plan Generation**
   - Select fitness level
   - Specify target areas
   - Choose available equipment
   - Set time constraints
   - Generate and download personalized workout plan

3. **Diet Plan Creation**
   - Input dietary preferences
   - Specify restrictions (Vegetarian/Non-Vegetarian/Vegan)
   - Set caloric goals
   - Generate and download comprehensive meal plan

## 🎨 UI/UX Features

- Glassmorphic design elements
- Responsive layout for all devices
- Intuitive navigation
- Progress indicators
- Interactive form elements
- Smooth animations
- Dark theme optimized

## 🔒 Security Considerations

- Secure password storage using Bcrypt
- Protected API endpoints
- Session management
- CORS configuration
- Environment variable usage
- SQL injection prevention
- XSS protection

## 🔄 API Integration

The application integrates with the Groq AI API for:
- Workout plan generation
- Diet plan creation
- Form recommendations
- Nutritional calculations

## 📱 Responsive Design

- Mobile-first approach
- Tablet optimization
- Desktop enhancement
- Cross-browser compatibility
- Touch-friendly interfaces

## 🚧 Future Enhancements

- Progress tracking dashboard
- Integration with fitness wearables
- Social sharing features
- Community support forum
- Mobile app development
- AI-powered progress analysis
- Recipe database integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Groq AI for providing the AI model
- Flask team for the excellent framework
- Bootstrap team for UI components
- Open source community for various tools and libraries

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

