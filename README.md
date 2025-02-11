# 🤖 Telegram Group Reader LLM Bot

This project is a **Telegram bot** that allows users to log in using their Telegram account and retrieve the last **10 messages** from a specified Telegram group they are a member of. Additionally, it can generate a **summary of the last 10 messages** using a **Large Language Model (LLM)** to provide users with a quick overview of recent discussions.


## Usage 💡

### Commands
- `/start` - Initialize the bot
- `/menu` - Show interactive menu
- `/login` - Login to your Telegram account
- `/logout` - Logout from your account
- `/messages <groupId>` - Get last 10 messages from a group
- `/summary <groupId>` - Get AI summary of last 10 messages

### Interactive Menu
The bot provides an interactive menu with buttons for:
- Getting messages
- Generating summaries
- Login/Logout

## Technical Approach & Trade-offs 🔧

### Architecture
- **Modular Design**: Separated concerns into services and handlers
- **Service Layer**: Abstracted core functionalities into services
- **Handler Layer**: Managed bot commands and user interactions
- **Database Layer**: Used Prisma for type-safe database operations

### Security
- **Session Encryption**: AES-256-CBC encryption for stored sessions
- **Environment Variables**: Secure credential management
- **Error Handling**: Filtered error messages to prevent data leakage

### Session Security
- **Approach**: User session strings are encrypted using **AES-256-CBC** before storage. This ensures that even if the database is compromised, raw session data remains protected.
- **Trade-off**:
  - Pro: Strong encryption prevents direct access to user session data.
  - Con: If **SESSION_SECRET** is exposed, all stored sessions become vulnerable.
- **Solution**:  
  - Store **SESSION_SECRET** securely in **AWS KMS** instead of the `.env` file.  
  - Instead of storing `SESSION_SECRET` in an `.env` file, we can use **Docker Secrets** to keep it safe in containerized environments.
 

## 📖 How It Works

1. **User starts the bot** `/start`
2. If logged in, they see options:
   - 📩 Fetch Last 10 Messages 
   - 📝 Get Summary of Last 10 Messages
   - 🚪 Logout  
3. If not logged in, they see:  
   - 🔑 Login  
4. Users authenticate via phone number and code.
5. The session is encrypted and saved securely.

## 🛠️ Setup

### Prerequisites

- Node.js & npm installed
- PostgreSQL database
- Telegram API credentials

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/caelusweb3/telegram-group-reader.git
   cd telegram-group-reader
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file:
   ```sh
   cp .env.example .env
   ```

4. Start the bot:
   ```sh 
   npm run dev
   ```

## Project Structure 📁

```
src/
├── config/         # Configuration management
├── handlers/       # Command and action handlers
├── services/       # Core business logic
├── utils/         # Utility functions
└── bot.ts         # Main bot file

prisma/
└── schema.prisma  # Database schema
```

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.
