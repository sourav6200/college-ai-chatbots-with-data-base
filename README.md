# 🤖 College AI Chatbot - Google Gemini API

A simple and functional AI chatbot web application built using Google Gemini API for college projects.

## 📋 Features

- ✅ Interactive chat interface
- ✅ Conversation history maintained
- ✅ Real-time responses from Google Gemini AI
- ✅ Clean and responsive UI
- ✅ Clear chat functionality
- ✅ Loading indicators
- ✅ Error handling

## 🛠️ Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **AI API**: Google Gemini API
- **Dependencies**: 
  - express
  - @google/generative-ai
  - dotenv
  - cors

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- Google Gemini API Key

### Steps

1. **Get your Gemini API Key**
   - Go to https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Create a new API key
   - Copy the API key

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   - Open the `.env` file
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## 🚀 How to Run

1. **Start the Server**
   ```bash
   npm start
   ```
   or
   ```bash
   node server.js
   ```

2. **Open in Browser**
   - Navigate to: http://localhost:3000
   - Start chatting with the AI assistant!

## 📁 Project Structure

```
college-chatbot/
├── .env                 # Environment variables (API key)
├── package.json         # Project dependencies
├── server.js           # Express server & API integration
├── README.md           # Project documentation
└── public/
    ├── index.html      # Main HTML file
    ├── style.css       # Styling
    └── script.js       # Frontend JavaScript
```

## 💡 Usage

1. Type your question in the input field
2. Press Enter or click the "Send" button
3. Wait for the AI to respond
4. Continue the conversation
5. Click "Clear" to reset the chat

## 🎯 Use Cases

- General knowledge questions
- Study help and explanations
- Code assistance
- Writing help
- Project ideas
- Research assistance

## 🔧 Troubleshooting

### Server won't start
- Make sure all dependencies are installed: `npm install`
- Check if port 3000 is already in use
- Verify Node.js is installed: `node --version`

### API errors
- Verify your API key is correct in the `.env` file
- Check your internet connection
- Ensure you haven't exceeded API quota

### Can't connect to server
- Make sure the server is running
- Check you're using the correct URL: http://localhost:3000
- Disable any ad blockers or VPN that might interfere

## 🎓 For College Presentation

### Key Points to Highlight:
1. **Technology Stack**: Modern web technologies
2. **API Integration**: Successfully integrated Google's latest AI
3. **User Experience**: Clean, responsive interface
4. **Functionality**: Real conversation with context memory
5. **Code Quality**: Well-structured, commented code

### Demo Script:
1. Show the clean interface
2. Ask a general question (e.g., "What is AI?")
3. Ask a follow-up question to demonstrate context
4. Show error handling (disconnect server briefly)
5. Demonstrate clear chat feature
6. Explain the code architecture

## 🚀 Future Improvements

- [ ] Add voice input/output
- [ ] Implement user authentication
- [ ] Save chat history to database
- [ ] Add different AI personalities
- [ ] Support for image inputs
- [ ] Dark mode toggle
- [ ] Export chat conversations
- [ ] Multi-language support

## 📝 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Your Name - College Project 2024

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Express.js for backend framework
- All open-source contributors

---

**Note**: Remember to never share your API key publicly. Always use environment variables for sensitive information.

For issues or questions, please create an issue in the repository or contact the project maintainer.
