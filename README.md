# Filter.AI

AI-powered spam detection and moderation bot for Telegram groups using Google Gemini.

## Overview

Filter.AI is an intelligent Telegram bot that helps keep your group chats clean and civilized. Using Google's Gemini AI, it analyzes reported messages to detect spam and uncivilized content, automatically banning offenders and maintaining a detailed log of all actions.

## Features

- **AI-Powered Analysis**: Leverages Google Gemini 2.5 Flash for intelligent message classification
- **Automatic Moderation**: Bans users and deletes messages identified as spam or uncivilized
- **Detailed Logging**: Maintains a CSV log of all banned users with timestamps and reasons
- **Simple Commands**: Easy-to-use interface with `/start` and `/report` commands
- **Privacy-Focused**: Only analyzes messages when explicitly reported by group members

## Getting Started

### Prerequisites

- Python 3.7 or higher
- A Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- A Google Gemini API Key (from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/iput-object/Filter.Ai.git
   cd Filter.Ai
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the bot**
   ```bash
   python main.py
   ```

## 🎯 Usage

### Setting Up in Your Group

1. Add the bot to your Telegram group
2. Promote the bot to admin with the following permissions:
   - Delete messages
   - Ban users

### Commands

- `/start` - Display help and documentation
- `/report` - Report a message (must be used as a reply to the message you want to report)

### How It Works

1. A user replies to a suspicious message with `/report`
2. The bot analyzes the message content using Gemini AI
3. If classified as "spam" or "uncivilized":
   - The message is deleted
   - The user is banned from the group
   - The incident is logged to `banned_logs.csv`
4. If the message is safe, the bot notifies that no action is needed

## Logging

All ban actions are logged to `banned_logs.csv` with the following information:
- Timestamp
- User ID
- Username
- Reason (spam/uncivilized)
- Message content

## Technical Details

### Dependencies

- `python-telegram-bot` - Telegram Bot API wrapper
- `google-generativeai` - Google Gemini AI integration
- `python-dotenv` - Environment variable management

### Project Structure

```
Filter.Ai/
├── main.py              # Main bot application
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── LICENSE             # Project license
├── README.md           # This file
└── banned_logs.csv     # Ban logs (generated at runtime)
```

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Limitations

- Currently only analyzes text messages
- Requires admin permissions to function
- Depends on Gemini AI availability and API limits

## Future Enhancements

- Support for analyzing images and media
- Customizable sensitivity levels
- Dashboard for viewing ban statistics
- Whitelist/blacklist functionality

## Support

Considerably Start the Repo and have fun ✨

## Acknowledgments

- [python-telegram-bot](https://github.com/python-telegram-bot/python-telegram-bot) - Telegram Bot API wrapper
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI model for content analysis

---

Made with ❤️ for safer Telegram communities