# TechCare Backend

This repository contains the backend of **TechCare**, a service provider platform offering real-time chat, secure authentication, and payment integration.

## 🌟 Features
- **JWT Authentication**: Ensures secure API access with token-based authentication.
- **Real-Time Communication**: Powered by **Socket.io** for live chat functionality.
- **Payment Integration**: Razorpay for seamless transactions.
- **Media Management**: **Cloudinary** for handling uploaded images.
- **Email Verification**: OTP-based user verification using **Nodemailer**.

## Key Features
- 🔒 Secure JWT Authentication
- 💬 Real-time Socket.io communication
- 💸 Razorpay payment integration
- 📧 Email OTP verification
- ☁️ Cloudinary media upload

## Project Structure
```
backend/
├── config/
│   ├── db.js
│   └── cloudinary.js
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
│   ├── emailService.js
│   └── paymentService.js
└── server.js
```

## 🚀 Tech Stack
- **Framework**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT), bcrypt.js
- **Utilities**: Razorpay SDK, Cloudinary SDK, Nodemailer, Moment.js

## 💻 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YesudasZ/TechCare-backend.git
   ```
2. Navigate to the project directory:
   ```bash
   cd TechCare-backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongo_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_password
   ```
5. Start the server:
   ```bash
   npm start
   ```
6. The server runs on:
   ```
   http://localhost:5000
   ```

## 📦 Scripts
- `npm start`: Start the server using **nodemon**.
- `npm test`: Placeholder for test scripts.

## 🌐 Live Application
The backend is hosted on **AWS** and serves the frontend hosted on **Vercel**.

## 🔧 Tools & Libraries
- **Express.js**: For API endpoints.
- **Socket.io**: For real-time features.
- **Razorpay SDK**: For payment processing.
- **Cloudinary SDK**: For image storage and retrieval.
- **Nodemailer**: For sending emails.

## Security Practices
- Bcrypt password hashing
- JWT token authentication
- CORS configuration
- Environment variable management
- Input validation and sanitization

## Deployment
- Hosted on AWS
- Use process managers like PM2 for production
- Configure environment-specific settings

## API Documentation
Detailed API documentation should be generated using tools like Swagger or Postman.

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Continuous Improvements
- Implement comprehensive unit and integration tests
- Set up CI/CD pipeline
- Regular security audits

## 📜 License
This project is licensed under the MIT License.

