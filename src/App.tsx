import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

const Terminal = styled.div`
  background-color: #1e1e1e;
  color: #ffffff;
  padding: 20px;
  font-family: 'Courier New', Courier, monospace;
  height: 100vh;
  overflow-y: auto;
`

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
`

const Prompt = styled.span`
  color: #00ff00;
  margin-right: 8px;
`

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
`

const OutputLine = styled.div<{ $type?: 'error' | 'success' }>`
  margin: 5px 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${props => {
    switch (props.$type) {
      case 'error':
        return '#ff6b6b'
      case 'success':
        return '#69db7c'
      default:
        return '#ffffff'
    }
  }};
`

interface User {
  id: number
  username: string
  token?: string
}

interface Post {
  id: string
  content: string
  username: string
  timestamp: string
  likes: number
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [output, setOutput] = useState<Array<{ text: string; type?: 'error' | 'success' }>>([
    { text: 'Welcome to DevTerminal - A Social Platform for Developers!' },
    { text: 'Type "help" for available commands.' }
  ])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const addOutput = (text: string, type?: 'error' | 'success') => {
    setOutput(prev => [...prev, { text, type }])
  }

  const getPrompt = () => {
    return currentUser ? `${currentUser.username}@devterminal$` : 'guest@devterminal$'
  }

  const handleSignup = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up')
      }

      setCurrentUser({
        id: data.user.id,
        username: data.user.username,
        token: data.token
      })
      addOutput(`Account created successfully! Welcome, ${username}!`, 'success')
    } catch (error: any) {
      addOutput(error.message || 'An error occurred during signup', 'error')
    }
  }

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login')
      }

      setCurrentUser({
        id: data.user.id,
        username: data.user.username,
        token: data.token
      })
      addOutput(`Welcome back, ${username}!`, 'success')
    } catch (error: any) {
      addOutput(error.message || 'An error occurred during login', 'error')
    }
  }

  const handlePost = async (content: string) => {
    if (!currentUser) {
      addOutput('You must be logged in to post', 'error')
      return
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post')
      }

      addOutput('Post created successfully!', 'success')
    } catch (error: any) {
      addOutput(error.message || 'An error occurred while creating post', 'error')
    }
  }

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      addOutput('You must be logged in to like posts', 'error')
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to like/unlike post')
      }

      addOutput(data.message, 'success')
    } catch (error: any) {
      addOutput(error.message || 'An error occurred while liking/unliking the post', 'error')
    }
  }

  const handleFollow = async (userId: string) => {
    if (!currentUser) {
      addOutput('You must be logged in to follow users', 'error')
      return
    }

    try {
      const response = await fetch(`/api/users/follow/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to follow/unfollow user')
      }

      addOutput(data.message, 'success')
    } catch (error: any) {
      addOutput(error.message || 'An error occurred while following/unfollowing the user', 'error')
    }
  }

  const handleProfile = async (username: string) => {
    if (!currentUser) {
      addOutput('You must be logged in to view profiles', 'error')
      return
    }

    try {
      const response = await fetch(`/api/users/profile/${username}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile')
      }

      addOutput(`Profile for @${data.username}:`, 'success')
      addOutput(`Followers: ${data.followers_count}`)
      addOutput(`Following: ${data.following_count}`)
      addOutput(`Posts: ${data.posts_count}`)
      addOutput(`Following: ${data.is_following ? 'Yes' : 'No'}`)
      addOutput(`Member since: ${new Date(data.created_at).toLocaleDateString()}`)
      addOutput(`User ID: ${data.id} (use this ID with the follow command)`)
    } catch (error: any) {
      addOutput(error.message || 'An error occurred while fetching the profile', 'error')
    }
  }

  const handleFeed = async () => {
    if (!currentUser) {
      addOutput('You must be logged in to view your feed', 'error')
      return
    }

    try {
      const response = await fetch('/api/posts/feed', {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      })

      const posts = await response.json()

      if (!response.ok) {
        throw new Error('Failed to fetch feed')
      }

      addOutput('\n=== Your Feed ===')
      posts.forEach((post: Post) => {
        addOutput(`\n@${post.username} (${post.timestamp})`)
        addOutput(`[Post ID: ${post.id}] ${post.content}`)
        addOutput(`Likes: ${post.likes}\n${'─'.repeat(40)}`)
      })
    } catch (error: any) {
      addOutput(error.message || 'An error occurred while fetching feed', 'error')
    }
  }

  const handleCommand = (command: string) => {
    const args = command.trim().split(' ')
    const cmd = args[0].toLowerCase()

    setCommandHistory(prev => [...prev, command])
    setHistoryIndex(-1)
    addOutput(`${getPrompt()} ${command}`)

    switch (cmd) {
      case 'signup':
        if (args.length !== 3) {
          addOutput('Usage: signup <username> <password>', 'error')
          break
        }
        handleSignup(args[1], args[2])
        break

      case 'login':
        if (args.length !== 3) {
          addOutput('Usage: login <username> <password>', 'error')
          break
        }
        handleLogin(args[1], args[2])
        break

      case 'logout':
        if (currentUser) {
          setCurrentUser(null)
          addOutput('Logged out successfully', 'success')
        } else {
          addOutput('You are not logged in', 'error')
        }
        break

      case 'post':
        if (args.length < 2) {
          addOutput('Usage: post <your message here>', 'error')
          break
        }
        const content = args.slice(1).join(' ')
        handlePost(content)
        break

      case 'like':
        if (args.length !== 2) {
          addOutput('Usage: like <post_id>', 'error')
          break
        }
        handleLike(args[1])
        break

      case 'feed':
        handleFeed()
        break

      case 'clear':
        setOutput([])
        break

      case 'help':
        addOutput('Available commands:')
        addOutput('  signup <username> <password> - Create a new account')
        addOutput('  login <username> <password> - Log into your account')
        addOutput('  post <content> - Create a new post')
        addOutput('  feed - View your feed')
        addOutput('  like <post_id> - Like/unlike a post')
        addOutput('  profile <username> - View a user\'s profile')
        addOutput('  follow <user_id> - Follow/unfollow a user')
        addOutput('  clear - Clear the terminal')
        addOutput('  logout - Log out of your account')
        break

      case 'profile':
        if (args.length !== 2) {
          addOutput('Usage: profile <username>', 'error')
        } else {
          handleProfile(args[1])
        }
        break

      case 'follow':
        if (args.length !== 2) {
          addOutput('Usage: follow <user_id>', 'error')
        } else {
          handleFollow(args[1])
        }
        break

      default:
        addOutput(`Command not found: ${cmd}`, 'error')
        addOutput('Type "help" for available commands.')
    }
    
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleCommand(inputValue)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInputValue('')
      }
    }
  }

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
  )
} 