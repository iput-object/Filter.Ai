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
LOG_FILE = "banned_logs.csv"

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

async def report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.reply_to_message:
        await update.message.reply_text("Please reply to a message with /report to report it.")
        return

    replied_message = update.message.reply_to_message
    message_text = replied_message.text

    if not message_text:
        await update.message.reply_text("I can only analyze text messages for now.")
        return

    if not model:
        await update.message.reply_text("Gemini API is not configured.")
        return

    # Analyze with Gemini
    try:
        prompt = (
            f"Analyze the following message and determine if it is 'spam', 'uncivilized', or 'safe'. "
            f"Return ONLY one of these three words.\n\nMessage: \"{message_text}\""
        )
        response = model.generate_content(prompt)
        result = response.text.strip().lower()
        
        logging.info(f"Gemini analysis result: {result}")

        if "spam" in result or "uncivilized" in result:
            # Ban the user
            user_to_ban = replied_message.from_user
            chat_id = update.effective_chat.id
            
            try:
                await context.bot.ban_chat_member(chat_id, user_to_ban.id)
                log_ban(user_to_ban, result, message_text)
                await update.message.reply_text(f"Message analyzed as {result}. User {user_to_ban.first_name} has been banned.")
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
    
    report_handler = CommandHandler('report', report)
    application.add_handler(report_handler)
    
    logging.info("Bot is running...")
    application.run_polling()
