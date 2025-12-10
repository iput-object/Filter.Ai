import os
import logging
import csv
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LOG_CHANNEL=os.getenv("TELEGRAM_LOG_CHANNEL")
LOG_FILE = "banned_logs.csv"
ENVIRONMENT=os.getenv("ENVIRONMENT", "PRODUCTION")

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    logging.warning("GEMINI_API_KEY not found in environment variables.")
    model = None

def log_ban(user, reason, message_text):
    """Logs the ban details to a CSV file."""
    file_exists = os.path.isfile(LOG_FILE)
    
    try:
        with open(LOG_FILE, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            if not file_exists:
                writer.writerow(["Timestamp", "User ID", "Username", "Reason", "Message Content"])
            
            writer.writerow([
                datetime.now().isoformat(),
                user.id,
                user.username or "N/A",
                reason,
                message_text
            ])
    except Exception as e:
        logging.error(f"Failed to write to log file: {e}")

async def log_ban_telegram(update: Update, context: ContextTypes.DEFAULT_TYPE, user, reason, message_text):
    if not LOG_CHANNEL:
        logging.warn('Log Channel ID not provided yet..')
        return
    
    user_id = user.id
    full_name = user.full_name 

    message = (
        f"User Banned Alert\n"
        f"User: <a href='tg://user?id={user_id}'>{full_name}</a>\n"
        f"Reason: {reason}\n"
        f"Message: {message_text}"
    )

    await context.bot.send_message(
        chat_id=LOG_CHANNEL,
        text=message,
        parse_mode="HTML"
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Sends documentation about the bot when /start command is used."""
    documentation = """
🤖 **Filter.AI - Spam Detection Bot**

AI-powered spam detection for Telegram groups using Google Gemini.

**How to Use:**
Reply to any message with `/report` to analyze it. If it's spam, the user will be automatically banned.

**Requirements:**
• Bot must be an admin with ban permissions
• Only text messages can be analyzed

**Commands:**
/start - Show this help
/report - Report a message (reply to message)

**Logs Channel**
Telegram - @filterAiLogs

**Source Code**
🔗 GitHub: https://github.com/iput-object/Filter.Ai

(Open for contribution)
"""
    await update.message.reply_text(documentation, parse_mode='Markdown')

async def report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.reply_to_message:
        await update.message.reply_text("Please reply to a message with /report to report it.")
        return

    replied_message = update.message.reply_to_message
    message_text = replied_message.caption or replied_message.text # texts and captions

    if not message_text:
        await update.message.reply_text("I can only analyze texts or captions messages for now.")
        return

    if not model:
        await update.message.reply_text("Gemini API is not configured.")
        return

    # Analyze with Gemini
    try:
        prompt = (
            f"Analyze the following message and classify it as 'spam' or 'safe'. "
            "Consider the overall content of the message. "
            "Label the message as 'spam' if it contains: "
            "- Unsolicited advertising, links, or offers, especially for adult content or products. "
            "- Any content that appears deceptive or intended to trick the reader. "
            "- Harassment, explicit sexual content, or any form of exploitation. "
            "If the message does not contain any of the above and seems generally harmless, label it as 'safe'. "
            "Return ONLY one of these two words: 'spam' or 'safe'.\n\n"
            f"Message: \"{message_text}\""
        )
        response = model.generate_content(prompt)
        result = response.text.strip().lower()
        
        logging.info(f"Gemini analysis result: {result}")

        if "spam" in result:
            # Ban the user
            user_to_ban = replied_message.from_user
            chat_id = update.effective_chat.id
            
            try:
                await context.bot.delete_message(chat_id, replied_message.message_id) # Delete the Message as well.
                await context.bot.ban_chat_member(chat_id, user_to_ban.id)
                await update.message.reply_text(f"Message analyzed as {result}. User {user_to_ban.first_name} has been banned.")

                if (ENVIRONMENT == "PRODUCTION"):
                    await log_ban_telegram(update , context , user_to_ban, result, message_text)
                else:
                    log_ban(user_to_ban, result, message_text)

            except Exception as e:
                logging.error(f"Failed to ban user: {e}")
                await update.message.reply_text(f"Message analyzed as {result}, but I couldn't ban the user. Make sure I am an admin.")
        else:
            await update.message.reply_text("Message seems safe.")

    except Exception as e:
        logging.error(f"Error during analysis: {e}")
        await update.message.reply_text("An error occurred while analyzing the message.")

if __name__ == '__main__':
    if not TELEGRAM_BOT_TOKEN:
        logging.error("TELEGRAM_BOT_TOKEN not found. Please set it in .env file.")
        exit(1)

    application = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    
    start_handler = CommandHandler('start', start)
    report_handler = CommandHandler('report', report)
    
    application.add_handler(start_handler)
    application.add_handler(report_handler)
    
    logging.info("Bot is running...")
    application.run_polling()
