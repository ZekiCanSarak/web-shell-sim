import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const Terminal = styled.div`
  background-color: #1e1e1e;
  color: #ffffff;
  padding: 20px;
  font-family: 'Courier New', Courier, monospace;
  height: 100vh;
  overflow-y: auto;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Prompt = styled.span`
  color: #00ff00;
  margin-right: 8px;
`;

const Input = styled.input`
  background-color: transparent;
  border: none;
  color: #ffffff;
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  width: 100%;
  caret-color: #ffffff;
  &:focus {
    outline: none;
  }
`;

interface OutputLineProps {
  $type?: 'error' | 'success';
}

const OutputLine = styled.div<OutputLineProps>`
  margin: 5px 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${props => {
    switch (props.$type) {
      case 'error':
        return '#ff6b6b';
      case 'success':
        return '#69db7c';
      default:
        return '#ffffff';
    }
  }};
`;

interface User {
  id: number;
  username: string;
  token?: string;
}

interface Post {
  id: string;
  content: string;
  username: string;
  timestamp: string;
  likes: number;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [output, setOutput] = useState<Array<{ text: string; type?: 'error' | 'success' }>>([
    { text: 'Welcome to DevTerminal - A Social Platform for Developers!' },
    { text: 'Type "help" for available commands.' }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const addOutput = (text: string, type?: 'error' | 'success') => {
    setOutput(prev => [...prev, { text, type }]);
  };

  const getPrompt = () => {
    return currentUser ? `${currentUser.username}@devterminal$` : 'guest@devterminal$';
  };

  const handleSignup = async (username: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }

      setCurrentUser({
        id: data.user.id,
        username: data.user.username,
        token: data.token
      });
      addOutput(`Account created successfully! Welcome, ${username}!`, 'success');
    } catch (error: any) {
      addOutput(error.message || 'An error occurred during signup', 'error');
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      setCurrentUser({
        id: data.user.id,
        username: data.user.username,
        token: data.token
      });
      addOutput(`Welcome back, ${username}!`, 'success');
    } catch (error: any) {
      addOutput(error.message || 'An error occurred during login', 'error');
    }
  };

  const handlePost = async (content: string) => {
    if (!currentUser) {
      addOutput('You must be logged in to post', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }

      addOutput('Post created successfully!', 'success');
    } catch (error: any) {
      addOutput(error.message || 'An error occurred while creating post', 'error');
    }
  };

  const handleFeed = async () => {
    if (!currentUser) {
      addOutput('You must be logged in to view your feed', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/posts/feed', {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });

      const posts = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      addOutput('\n=== Your Feed ===');
      posts.forEach((post: Post) => {
        addOutput(`\n@${post.username} (${post.timestamp})`);
        addOutput(post.content);
        addOutput(`Likes: ${post.likes}\n${'─'.repeat(40)}`);
      });
    } catch (error: any) {
      addOutput(error.message || 'An error occurred while fetching feed', 'error');
    }
  };

  const handleCommand = (command: string) => {
    const parts = command.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    addOutput(`${getPrompt()} ${command}`);

    switch (cmd) {
      case 'signup':
        if (args.length !== 2) {
          addOutput('Usage: signup <username> <password>', 'error');
          break;
        }
        handleSignup(args[0], args[1]);
        break;

      case 'login':
        if (args.length !== 2) {
          addOutput('Usage: login <username> <password>', 'error');
          break;
        }
        handleLogin(args[0], args[1]);
        break;

      case 'logout':
        if (currentUser) {
          setCurrentUser(null);
          addOutput('Logged out successfully', 'success');
        } else {
          addOutput('You are not logged in', 'error');
        }
        break;

      case 'post':
        if (args.length === 0) {
          addOutput('Usage: post "your message here"', 'error');
          break;
        }
        handlePost(args.join(' '));
        break;

      case 'feed':
        handleFeed();
        break;

      case 'clear':
        setOutput([]);
        break;

      case 'help':
        addOutput(`Available commands:
  signup <username> <password> - Create a new account
  login <username> <password>  - Log into your account
  logout                       - Log out of your account
  post "message"              - Create a new post
  feed                        - View posts from people you follow
  clear                       - Clear the terminal
  help                        - Show this help message`);
        break;

      default:
        addOutput(`Command not found: ${cmd}. Type 'help' for available commands.`, 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleCommand(inputValue);
      setInputValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Terminal onClick={() => inputRef.current?.focus()}>
      {output.map((line, i) => (
        <OutputLine key={i} $type={line.type}>
          {line.text}
        </OutputLine>
      ))}
      <InputWrapper>
        <Prompt>{getPrompt()}</Prompt>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
      </InputWrapper>
    </Terminal>
  );
};

export default App; 