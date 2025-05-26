# Interactive Avatar Demo

A production-ready TypeScript application featuring dual interfaces for AI interaction - text chat and streaming avatar with voice capabilities, plus mandatory survey functionality for data collection.

## ✨ Features

### **Core Functionality**
- **Dual Interface Modes**: Switch between text chat and video avatar
- **Real-time AI Avatar**: HeyGen streaming with lip-sync and voice
- **OpenAI Assistant Integration**: Advanced function calling capabilities
- **Smart Routing**: Hash-based SPA navigation
- **Persistent Configuration**: Auto-saves settings and preferences

### **🆕 Survey System**
- **Mandatory Pre-conversation Surveys**: Configurable questionnaires
- **Dynamic Question Management**: Add/remove/edit questions in real-time
- **Smart Validation**: Ensures complete responses before proceeding
- **Data Collection**: Structured survey response logging
- **Assistant Integration**: Seamless conversation flow with survey interruption

### **Function Calling**
- `callHuman`: Request human assistance with urgency levels
- `scheduleMeeting`: Meeting scheduling with preferences
- `showSlide`: Display presentation slides from knowledge base
- `submitSurveyData`: Collect and process survey responses

## 🏗️ Architecture

### **Clean MVC Pattern**
- **Services Layer**: Singleton services (Assistant, Avatar, Navigation, Configuration)
- **Pages Layer**: Route-based components (Home, Chat, Avatar, Settings)
- **Components Layer**: Reusable UI components with validation
- **Storage Layer**: localStorage with configuration management

### **Key Components**
- `AssistantService`: OpenAI integration with hot reload capability
- `AvatarService`: HeyGen streaming management
- `SurveyManager`: Dynamic survey configuration UI
- `ActionSelector`: Function calling configuration
- `NavigationService`: Hash-based routing

## 🚀 Prerequisites

- Node.js (v18 or higher)
- OpenAI API key
- OpenAI Assistant ID
- HeyGen API key

## ⚙️ Setup

1. **Clone and Install**
   ```bash
   git clone [repository-url]
   cd streaming-avatar-demo
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your configuration:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_OPENAI_ASSISTANT_ID=your_assistant_id
   VITE_OPENAI_MODEL=gpt-4.1-mini
   VITE_HEYGEN_API_KEY=your_heygen_api_key
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

## 📋 Usage Guide

### **Basic Setup**
1. Navigate to **Settings** to configure your assistant
2. Set opening introduction and behavior instructions
3. Select desired function calling capabilities
4. Optionally enable mandatory surveys with custom questions

### **Survey Configuration**
1. Check **"Submit Survey Data"** action in settings
2. Survey configuration section appears automatically
3. Add questions using **"Add Question"** button
4. Questions are asked before every new conversation
5. Responses are collected and logged via webhook

### **Chat/Avatar Modes**
- **Chat Mode**: Full-width text-based conversation
- **Avatar Mode**: Split layout with video avatar and chat
- Seamless switching between modes
- Persistent conversation state

## 🔧 Function Calling Examples

### **Human Assistance**
```javascript
// User: "I need to speak with someone urgently"
callHuman("Technical issue with payment", "high")
```

### **Meeting Scheduling**
```javascript
// User: "Can we schedule a demo for tomorrow?"
scheduleMeeting("Tomorrow 2PM", "Product Demo", ["john@company.com"])
```

### **Slide Presentation**
```javascript
// User: "Show me your pricing information"
showSlide("pricing_slide_001", "Detailed pricing tiers and features")
```

### **🆕 Survey Data Collection**
```javascript
// Automatically called after survey completion
submitSurveyData(
  ["What's your name?", "What industry are you in?"],
  ["John Smith", "Healthcare"]
)
```

## 📊 Data Resources

### **Knowledge Base Integration**
The project includes `product_demo_presentation.json` with:
- 15 detailed slides with metadata
- Rich semantic information
- Keywords for search relevance
- Context for appropriate slide selection

### **Setup Methods**
1. **OpenAI Playground (Recommended)**:
   - Upload JSON to vector store
   - Assign to your assistant
   - Automatic knowledge integration

2. **Custom Implementation**:
   - Convert to vector embeddings
   - Store in vector database
   - Enable assistant search capabilities

## 🏭 Production Features

### **Error Handling**
- Graceful degradation on API failures
- User-friendly error messages
- Automatic retry mechanisms
- Comprehensive logging

### **Performance**
- Singleton service pattern
- Initialize-once, show/hide pattern
- Efficient memory management
- Hot configuration reload

### **User Experience**
- Responsive design with Tailwind CSS v4
- Loading states and progress indicators
- Auto-focus and accessibility features
- Seamless navigation between modes

## 📁 Project Structure

```
src/
├── components/
│   ├── ChatInterface.ts       # Reusable chat UI
│   ├── SurveyManager.ts       # Survey configuration
│   └── forms/
│       ├── SetupForm.ts       # Main configuration form
│       ├── ActionSelector.ts  # Function calling setup
│       └── FormField.ts       # Reusable form inputs
├── services/
│   ├── AssistantService.ts    # OpenAI integration
│   ├── AvatarService.ts       # HeyGen integration
│   ├── NavigationService.ts   # Routing management
│   └── AssistantConfigService.ts # Configuration management
├── pages/
│   ├── HomePage.ts            # Landing page
│   ├── ChatPage.ts            # Text chat interface
│   ├── AvatarPage.ts          # Video avatar interface
│   └── SettingsPage.ts        # Configuration page
└── config/
    └── webhook.ts             # Function call handlers
```

## 🔒 Security Notes

- API keys are environment-based
- No sensitive data in localStorage
- Function calls are validated
- Error messages don't expose internals

## 🚀 Deployment

### **Build for Production**
```bash
npm run build
```

### **Preview Build**
```bash
npm run preview
```

### **Environment Variables in Production**
Ensure all `VITE_*` variables are set in your hosting environment.

## 📈 Analytics & Monitoring

Survey responses and function calls are logged with:
- Timestamps
- User context
- Response data
- Error tracking

Integrate with your analytics platform by modifying webhook handlers.

## 🛠️ Development

### **Technologies**
- **Frontend**: TypeScript, Vite, Tailwind CSS v4
- **AI**: OpenAI Assistant API with function calling
- **Avatar**: HeyGen Streaming Avatar API
- **Architecture**: Singleton services, hash routing

### **Code Style**
- TypeScript strict mode
- ESLint configuration
- Component-based architecture
- Clean separation of concerns

## 🆕 What's New in v2.0

- **Survey System**: Complete mandatory survey functionality
- **Hot Reload**: Configuration changes without page refresh
- **Enhanced UX**: Improved error handling and validation
- **Better Architecture**: Clean MVC pattern implementation
- **Production Ready**: Comprehensive error handling and logging

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Ready for enterprise use cases requiring user data collection, lead qualification, or customer research integration.** 🎉