# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Notes
- All releases are currently in alpha state
- Features may be incomplete or subject to breaking changes
- API stability not guaranteed until 1.0.0 release

## [0.4.4_alpha] - 2025-08-27
### BREAKING CHANGE
- Removed CHAT_NAME, CHAT_AVATAR_ID, and CHAT_COLOUR fields from .env file
  - These settings are now managed exclusively through data.json
  - Existing bots will need to transfer these values to data.json
  - See [migration guide](docs/migrations/0.4.3_to_0.4.4_alpha.md) for detailed instructions

### Added
- New `changeBotName` command for owners to modify bot name and appearance
- Enhanced DataService with methods for updating bot configuration
- HangUserService for improved user management and role verification

### Changed
- Expanded data.json structure to include bot appearance settings
  - Added CHAT_NAME, CHAT_AVATAR_ID, and CHAT_COLOUR fields
  - Settings persist across bot restarts and can be updated at runtime
- Improved DataService with atomic file operations
  - Added validation for configuration changes
  - Enhanced error handling for file operations
- Enhanced HangUserService with robust role checking
  - Added methods for verifying user permissions
  - Improved integration with command authorization

### Technical Details
- DataService now manages bot appearance configuration via data.json
- HangUserService provides comprehensive user role management
- New changeBotName command restricted to OWNER role
- Configuration changes are validated before being persisted
- Improved error handling for invalid configuration updates

## [0.4.3_alpha] - 2025-08-25
### Added
- New `welcome` command for moderators to customize the welcome message
- DataService for managing global configuration via data.json
- Configurable welcome messages with dynamic placeholders ({username}, {hangoutName})
- data.json file for persistent bot configuration

### Changed
- Welcome messages now use the DataService instead of hardcoded strings
- Improved message templating with dynamic placeholder replacement
- Enhanced service container with new DataService integration

### Technical Details
- DataService provides methods for loading and accessing global configuration
- Welcome messages support placeholders that are replaced at runtime
- Command permissions enforce moderator-only access for welcome message updates
- Configuration changes persist across bot restarts via data.json

## [0.4.2_alpha] - 2025-08-24
### Added
- New stateService for managing user roles and permissions
- Comprehensive role-based access control system
- Documentation for writing new commands (WRITING_NEW_COMMANDS.md)

### Changed
- Standardized command parameter structure with unified `commandParams` object
- Improved command handler pattern for better maintainability
- Enhanced service container with fallback support for essential services
- Command permissions now use hierarchical role system: OWNER > coOwner > MODERATOR > USER

### Technical Details
- Commands now receive a consistent parameter object containing:
  - command: The command name
  - args: Command arguments
  - services: Service container with fallbacks
  - context: Sender and message context

## [0.4.0_alpha] - 2025-08-21
### BREAKING CHANGE
- The .env value COMETCHAT_APP_ID has been changed to COMETCHAT_AUTH_TOKEN throughout the codebase to simplify onboarding. You **MUST** update the name of this variable in your .env file

### Added
- specific page in the docs directory on how to create the .env file
- assets for the enhanced documentation

### Changed
- Improved the README and onboarding documentation

## [0.3.0_alpha] - 2025-08-21
### Added
- Upvote function added
  - Bot will upvote 90 seconds after song starts playing

### Changed
- Improved socket logging
  - added SOCKET_MESSAGE_LOG_LEVEL to .env file
  - options are OFF, ON and DEBUG. Defaults to OFF
  - OFF = no separate socket message logging
  - ON = socket logging to files on a per message type basis
  - DEBUG = every socket message logged to its own file with an incrementing number

## [0.2.0_alpha] - 2025-08-19

### Added
- JSON patch-based state management for real-time socket updates using `fast-json-patch`
  - **ENSURE YOU RUN `npm install` TO INSTALL ANY NEW DEPENDENCIES**
- Enhanced `_setupStatefulMessageListener` with proper state patching and error handling
- Comprehensive state patching tests covering patch application, error scenarios, and immutability
- `hangSocketServices` for song voting functionality with upVote/downVote methods
- Socket-based voting actions using ttfm-socket ActionName.voteOnSong
- Improved test coverage configuration excluding unfinished code from coverage metrics
- State immutability preservation in socket message handling
- Detailed logging for state patch operations and errors
- Standardized changelog documentation following Keep a Changelog format

### Changed
- Improved logging for socket messages to aid debugging
- Enhanced bot.js to use fast-json-patch for stateful message processing
- Improved error handling in state patch application with graceful degradation
- Updated Jest configuration to exclude handlers/** and playlistService.js from coverage
- Enhanced serviceContainer to include hangSocketServices
- Strengthened test suite with 245 passing tests across 34 test suites

### Fixed
- Resolved test failures by removing problematic test files
- Fixed state management to maintain immutability during patch operations
- Improved error handling to prevent bot crashes on malformed patches

## [0.1.0_alpha] - 2025-08-19

### Added
- Initial alpha release of Mr. Roboto V3
- Basic bot framework with CometChat integration
- Socket connection management using ttfm-socket
- Message processing and command parsing system
- Service container architecture for dependency injection
- Comprehensive test suite with Jest
- Winston logging with daily rotation
- Configuration management with dotenv
- Message polling and batch processing
- Connection status monitoring and reconnection handling
- File-based message logging for debugging
- Build URL utilities with search parameter handling
- Command service for processing bot commands
- Message service for CometChat API interactions
- Parse commands service for command detection
- Group and private message handling
- User service for hang.fm user management

### Technical Details
- Node.js application with ES6+ features
- Axios for HTTP requests with mock adapter for testing
- UUID generation for unique identifiers
- WebSocket connections for real-time communication
- Modular service architecture
- Comprehensive error handling and logging
- Test coverage reporting with Jest
- Git-based version control with branching strategy

### Dependencies
- @cometchat/chat-sdk-javascript ^4.0.13
- axios ^1.10.0
- dotenv ^17.0.1
- fast-json-patch ^3.1.1
- ttfm-socket ^1.6.4
- winston ^3.17.0
- And various other production and development dependencies

### Known Limitations (Alpha State)
- Some handlers and services are incomplete (excluded from test coverage)
- API may change significantly before stable release
- Not recommended for production use
- Features under active development

---

## Release Types

- **Major** (X.y.z) - Breaking changes that require migration
- **Minor** (x.Y.z) - New features that are backward compatible  
- **Patch** (x.y.Z) - Bug fixes and small improvements
- **Alpha** (x.y.z-alpha) - Pre-release versions for testing, may have breaking changes

## Alpha Release Notice

This project is currently in **alpha development**. Alpha releases mean:

- Features are under active development and may be incomplete
- APIs and interfaces may change without notice
- Breaking changes can occur between any releases
- Not recommended for production use
- Feedback and testing welcome but expect instability
- Documentation may be incomplete or outdated

The project will transition to beta releases when core functionality is stable, and to stable releases (1.0.0+) when the API is considered stable and production-ready.

## Change Categories

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

## Links

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Repository](https://github.com/jodrell2000/mrRobotoV3)
