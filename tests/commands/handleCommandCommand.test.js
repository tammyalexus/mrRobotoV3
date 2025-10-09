// Mock the fs module before requiring the command// Mock the fs module before requiring the command// Mock the fs module before requiring the command// Mock the fs module before requiring the command// Mock the fs module before requiring the command

jest.mock('fs', () => ({

    readFileSync: jest.fn(),jest.mock('fs', () => ({

    writeFileSync: jest.fn(),

    readdirSync: jest.fn(),  readFileSync: jest.fn(),jest.mock('fs', () => ({

    existsSync: jest.fn()

}));  writeFileSync: jest.fn(),



const handleCommandCommand = require('../../src/commands/handleCommandCommand');  readdirSync: jest.fn(),  readFileSync: jest.fn().mockReturnValue(JSON.stringify({ disabledCommands: [] })),jest.mock('fs', () => ({jest.mock('fs', () => ({

const fs = require('fs');

  existsSync: jest.fn()

describe('handleCommandCommand', () => {

    let mockServices;}));  writeFileSync: jest.fn(),

    let mockCommandParams;



    beforeEach(() => {

        jest.clearAllMocks();const handleCommandCommand = require('../../src/commands/handleCommandCommand');  readdirSync: jest.fn().mockReturnValue(['handleHelpCommand.js', 'handlePingCommand.js']),  readFileSync: jest.fn().mockReturnValue(JSON.stringify({  readFileSync: jest.fn(),

        jest.resetAllMocks();

const fs = require('fs');

        mockServices = {

            messageService: {  existsSync: jest.fn().mockReturnValue(true)

                sendResponse: jest.fn()

            },describe('handleCommandCommand', () => {

            logger: {

                info: jest.fn(),  let mockServices;}));    welcomeMessage: "Hey {username}, welcome to {hangoutName}",  writeFileSync: jest.fn(),

                debug: jest.fn(),

                warn: jest.fn(),  let mockContext;

                error: jest.fn()

            }

        };

  beforeEach(() => {

        // Set up default fs mocks

        fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: [] }));    jest.clearAllMocks();const handleCommandCommand = require('../../src/commands/handleCommandCommand');    nowPlayingMessage: "{username} is now playing \"{trackName}\" by {artistName}",  readdirSync: jest.fn(),

        fs.writeFileSync.mockReturnValue();

        fs.readdirSync.mockReturnValue(['handleHelpCommand.js', 'handlePingCommand.js', 'handleStateCommand.js']);    

        fs.existsSync.mockReturnValue(true);

    mockServices = {const fs = require('fs');

        mockCommandParams = {

            command: 'command',      messageService: {

            args: 'list',

            services: mockServices,        sendResponse: jest.fn()    disabledCommands: [], // Ensure no commands are disabled for role testing  existsSync: jest.fn()

            context: {

                sender: 'testUser',      }

                fullMessage: {

                    isPrivateMessage: false    };describe('handleCommandCommand', () => {

                }

            },

            responseChannel: 'public'

        };    mockContext = {  let mockServices;    disabledFeatures: [],}));

    });

      sender: 'testUser',

    describe('list command', () => {

        it('should display all commands with their status', async () => {      fullMessage: {  let mockContext;

            fs.readFileSync.mockReturnValue(JSON.stringify({

                disabledCommands: ['ping']        isPrivateMessage: false

            }));

      }    botData: {

            const result = await handleCommandCommand(mockCommandParams);

    };

            expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

                expect.stringContaining('🔧 **Command Status:**'),  beforeEach(() => {

                expect.objectContaining({

                    responseChannel: 'public',    // Set up default fs mocks

                    isPrivateMessage: false,

                    sender: 'testUser',    fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: [] }));    jest.clearAllMocks();      CHAT_AVATAR_ID: "bot-1",const handleCommandCommand = require('../../src/commands/handleCommandCommand');

                    services: mockServices

                })    fs.writeFileSync.mockReturnValue();

            );

    fs.readdirSync.mockReturnValue(['handleHelpCommand.js', 'handlePingCommand.js', 'handleStateCommand.js']);    

            const responseMessage = mockServices.messageService.sendResponse.mock.calls[0][0];

            expect(responseMessage).toContain('🟢 **help** - enabled');    fs.existsSync.mockReturnValue(true);

            expect(responseMessage).toContain('🔴 **ping** - disabled');

            expect(responseMessage).toContain('🟢 **state** - enabled');  });    mockServices = {      CHAT_NAME: "K.D.A.M.",const fs = require('fs');

            expect(result.success).toBe(true);

        });

    });

  describe('list command', () => {      messageService: {

    describe('enable/disable commands', () => {

        it('should enable a disabled command', async () => {    it('should display all commands with their status', async () => {

            fs.readFileSync.mockReturnValue(JSON.stringify({

                disabledCommands: ['ping', 'help']      fs.readFileSync.mockReturnValue(JSON.stringify({        sendResponse: jest.fn()      CHAT_COLOUR: "ff9900"const path = require('path');

            }));

        disabledCommands: ['ping']

            mockCommandParams.args = 'enable ping';

      }));      }

            const result = await handleCommandCommand(mockCommandParams);



            expect(fs.writeFileSync).toHaveBeenCalledWith(

                expect.stringContaining('data.json'),      const result = await handleCommandCommand({    };    }

                JSON.stringify({ disabledCommands: ['help'] }, null, 2),

                'utf8'        args: 'list',

            );

        services: mockServices,

            expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

                "✅ Command 'ping' has been enabled",        context: mockContext,

                expect.objectContaining({

                    responseChannel: 'public',        responseChannel: 'public'    mockContext = {  })),describe('handleCommandCommand', () => {

                    isPrivateMessage: false,

                    sender: 'testUser',      });

                    services: mockServices

                })      sender: 'testUser',

            );

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

            expect(result.success).toBe(true);

        });        expect.stringContaining('🔧 **Command Status:**'),      fullMessage: {  writeFileSync: jest.fn(),  let mockServices;



        it('should disable an enabled command', async () => {        expect.objectContaining({

            fs.readFileSync.mockReturnValue(JSON.stringify({

                disabledCommands: ['help']          responseChannel: 'public',        isPrivateMessage: false

            }));

          isPrivateMessage: false,

            mockCommandParams.args = 'disable ping';

          sender: 'testUser',      }  readdirSync: jest.fn().mockReturnValue([  let mockContext;

            const result = await handleCommandCommand(mockCommandParams);

          services: mockServices

            expect(fs.writeFileSync).toHaveBeenCalledWith(

                expect.stringContaining('data.json'),        })    };

                JSON.stringify({ disabledCommands: ['help', 'ping'] }, null, 2),

                'utf8'      );

            );

  });    'handleHelpCommand.js',

            expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

                "✅ Command 'ping' has been disabled",      const responseMessage = mockServices.messageService.sendResponse.mock.calls[0][0];

                expect.objectContaining({

                    responseChannel: 'public',      expect(responseMessage).toContain('🟢 **help** - enabled');

                    isPrivateMessage: false,

                    sender: 'testUser',      expect(responseMessage).toContain('🔴 **ping** - disabled');

                    services: mockServices

                })      expect(responseMessage).toContain('🟢 **state** - enabled');  it('should list commands with their status', async () => {    'handlePingCommand.js',  beforeEach(() => {

            );

      expect(result.success).toBe(true);

            expect(result.success).toBe(true);

        });    });    fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['ping'] }));

    });

  });

    describe('error handling', () => {

        it('should require arguments', async () => {    'handleStateCommand.js'    mockServices = {

            mockCommandParams.args = '';

  describe('enable/disable commands', () => {

            const result = await handleCommandCommand(mockCommandParams);

    it('should enable a disabled command', async () => {    const result = await handleCommandCommand({

            expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

                'Please specify an action: list, enable <command>, disable <command>, or status <command>',      fs.readFileSync.mockReturnValue(JSON.stringify({

                expect.objectContaining({

                    responseChannel: 'public',        disabledCommands: ['ping', 'help']      args: 'list',  ]),      messageService: {

                    isPrivateMessage: false,

                    sender: 'testUser',      }));

                    services: mockServices

                })      services: mockServices,

            );

      const result = await handleCommandCommand({

            expect(result.success).toBe(false);

        });        args: 'enable ping',      context: mockContext,  existsSync: jest.fn().mockReturnValue(true)        sendResponse: jest.fn()



        it('should handle non-existent commands', async () => {        services: mockServices,

            fs.existsSync.mockReturnValue(false);

            mockCommandParams.args = 'enable nonexistent';        context: mockContext,      responseChannel: 'public'



            const result = await handleCommandCommand(mockCommandParams);        responseChannel: 'public'



            expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(      });    });}));      }

                "❌ Command 'nonexistent' does not exist",

                expect.objectContaining({

                    responseChannel: 'public',

                    isPrivateMessage: false,      expect(fs.writeFileSync).toHaveBeenCalledWith(

                    sender: 'testUser',

                    services: mockServices        expect.stringContaining('data.json'),

                })

            );        JSON.stringify({ disabledCommands: ['help'] }, null, 2),    expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(    };



            expect(result.success).toBe(false);        'utf8'

        });

    });      );      expect.stringContaining('🔧 **Command Status:**'),

});


      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(      expect.objectContaining({const handleCommandCommand = require('../../src/commands/handleCommandCommand');

        "✅ Command 'ping' has been enabled",

        expect.objectContaining({        responseChannel: 'public',

          responseChannel: 'public',

          isPrivateMessage: false,        isPrivateMessage: false,const fs = require('fs');    mockContext = {

          sender: 'testUser',

          services: mockServices        sender: 'testUser',

        })

      );        services: mockServices      sender: 'testUser',



      expect(result.success).toBe(true);      })

    });

    );describe('handleCommandCommand', () => {      fullMessage: {

    it('should disable an enabled command', async () => {

      fs.readFileSync.mockReturnValue(JSON.stringify({

        disabledCommands: ['help']

      }));    expect(result.success).toBe(true);  let mockServices;        isPrivateMessage: false



      const result = await handleCommandCommand({  });

        args: 'disable ping',

        services: mockServices,  let mockContext;      }

        context: mockContext,

        responseChannel: 'public'  it('should require arguments', async () => {

      });

    const result = await handleCommandCommand({    };

      expect(fs.writeFileSync).toHaveBeenCalledWith(

        expect.stringContaining('data.json'),      args: '',

        JSON.stringify({ disabledCommands: ['help', 'ping'] }, null, 2),

        'utf8'      services: mockServices,  beforeEach(() => {

      );

      context: mockContext,

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

        "✅ Command 'ping' has been disabled",      responseChannel: 'public'    mockServices = {    // Reset all mocks

        expect.objectContaining({

          responseChannel: 'public',    });

          isPrivateMessage: false,

          sender: 'testUser',      messageService: {    jest.clearAllMocks();

          services: mockServices

        })    expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

      );

      'Please specify an action: list, enable <command>, disable <command>, or status <command>',        sendResponse: jest.fn()    

      expect(result.success).toBe(true);

    });      expect.objectContaining({

  });

        responseChannel: 'public',      }    // Set up default fs mocks

  describe('error handling', () => {

    it('should require arguments', async () => {        isPrivateMessage: false,

      const result = await handleCommandCommand({

        args: '',        sender: 'testUser',    };    fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: [] }));

        services: mockServices,

        context: mockContext,        services: mockServices

        responseChannel: 'public'

      });      })    fs.writeFileSync.mockReturnValue();



      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(    );

        'Please specify an action: list, enable <command>, disable <command>, or status <command>',

        expect.objectContaining({    mockContext = {    fs.readdirSync.mockReturnValue([]);

          responseChannel: 'public',

          isPrivateMessage: false,    expect(result.success).toBe(false);

          sender: 'testUser',

          services: mockServices  });      sender: 'testUser',    fs.existsSync.mockReturnValue(true);

        })

      );});

      fullMessage: {  });

      expect(result.success).toBe(false);

    });        isPrivateMessage: false



    it('should handle non-existent commands', async () => {      }  describe('list command', () => {

      fs.existsSync.mockReturnValue(false);

    };    it('should display all commands with their status', async () => {

      const result = await handleCommandCommand({

        args: 'enable nonexistent',      // Mock commands directory scan

        services: mockServices,

        context: mockContext,    // Reset all mocks      fs.readdirSync.mockReturnValue([

        responseChannel: 'public'

      });    jest.clearAllMocks();        'handleHelpCommand.js',



      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(            'handlePingCommand.js',

        "❌ Command 'nonexistent' does not exist",

        expect.objectContaining({    // Set up default fs mocks        'handleStateCommand.js'

          responseChannel: 'public',

          isPrivateMessage: false,    fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: [] }));      ]);

          sender: 'testUser',

          services: mockServices    fs.writeFileSync.mockReturnValue();

        })

      );    fs.readdirSync.mockReturnValue(['handleHelpCommand.js', 'handlePingCommand.js', 'handleStateCommand.js']);      // Mock data.json read for disabled commands



      expect(result.success).toBe(false);    fs.existsSync.mockReturnValue(true);      fs.readFileSync.mockReturnValue(JSON.stringify({

    });

  });  });        disabledCommands: ['ping']

});
      }));

  describe('list command', () => {

    it('should display all commands with their status', async () => {      await handleCommandCommand({

      // Mock commands directory scan        args: 'list',

      fs.readdirSync.mockReturnValue([        services: mockServices,

        'handleHelpCommand.js',        context: mockContext,

        'handlePingCommand.js',        responseChannel: 'public'

        'handleStateCommand.js'      });

      ]);

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

      // Mock data.json read for disabled commands        expect.stringContaining('🔧 **Command Status:**'),

      fs.readFileSync.mockReturnValue(JSON.stringify({        expect.objectContaining({

        disabledCommands: ['ping']          responseChannel: 'public',

      }));          isPrivateMessage: false,

          sender: 'testUser',

      await handleCommandCommand({          services: mockServices

        args: 'list',        })

        services: mockServices,      );

        context: mockContext,

        responseChannel: 'public'      const responseMessage = mockServices.messageService.sendResponse.mock.calls[0][0];

      });      expect(responseMessage).toContain('🟢 **help** - enabled');

      expect(responseMessage).toContain('🔴 **ping** - disabled');

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(      expect(responseMessage).toContain('🟢 **state** - enabled');

        expect.stringContaining('🔧 **Command Status:**'),    });

        expect.objectContaining({

          responseChannel: 'public',    it('should handle empty commands directory', async () => {

          isPrivateMessage: false,      fs.readdirSync.mockReturnValue([]);

          sender: 'testUser',

          services: mockServices      await handleCommandCommand({

        })        args: 'list',

      );        services: mockServices,

        context: mockContext,

      const responseMessage = mockServices.messageService.sendResponse.mock.calls[0][0];        responseChannel: 'public'

      expect(responseMessage).toContain('🟢 **help** - enabled');      });

      expect(responseMessage).toContain('🔴 **ping** - disabled');

      expect(responseMessage).toContain('🟢 **state** - enabled');      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

    });        '❌ No commands found',

        expect.objectContaining({

    it('should handle empty commands directory', async () => {          responseChannel: 'public',

      fs.readdirSync.mockReturnValue([]);          isPrivateMessage: false,

          sender: 'testUser',

      await handleCommandCommand({          services: mockServices

        args: 'list',        })

        services: mockServices,      );

        context: mockContext,    });

        responseChannel: 'public'  });

      });

  describe('enable command', () => {

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(    it('should enable a disabled command', async () => {

        '❌ No commands found',      const mockData = {

        expect.objectContaining({        disabledCommands: ['ping', 'help']

          responseChannel: 'public',      };

          isPrivateMessage: false,

          sender: 'testUser',      // Mock command existence check

          services: mockServices      fs.existsSync.mockReturnValue(true);

        })      

      );      // Mock reading data.json

    });      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

  });

      await handleCommandCommand({

  describe('enable command', () => {        args: 'enable ping',

    it('should enable a disabled command', async () => {        services: mockServices,

      const mockData = {        context: mockContext,

        disabledCommands: ['ping', 'help']        responseChannel: 'public'

      };      });



      // Mock command existence check      expect(fs.writeFileSync).toHaveBeenCalledWith(

      fs.existsSync.mockReturnValue(true);        expect.stringContaining('data.json'),

              JSON.stringify({ disabledCommands: ['help'] }, null, 2),

      // Mock reading data.json        'utf8'

      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));      );



      await handleCommandCommand({      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

        args: 'enable ping',        "✅ Command 'ping' has been enabled",

        services: mockServices,        expect.objectContaining({

        context: mockContext,          responseChannel: 'public',

        responseChannel: 'public'          isPrivateMessage: false,

      });          sender: 'testUser',

          services: mockServices

      expect(fs.writeFileSync).toHaveBeenCalledWith(        })

        expect.stringContaining('data.json'),      );

        JSON.stringify({ disabledCommands: ['help'] }, null, 2),    });

        'utf8'

      );    it('should handle already enabled command', async () => {

      fs.existsSync.mockReturnValue(true);

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['help'] }));

        "✅ Command 'ping' has been enabled",

        expect.objectContaining({      await handleCommandCommand({

          responseChannel: 'public',        args: 'enable ping',

          isPrivateMessage: false,        services: mockServices,

          sender: 'testUser',        context: mockContext,

          services: mockServices        responseChannel: 'public'

        })      });

      );

    });      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

        "ℹ️ Command 'ping' is already enabled",

    it('should handle already enabled command', async () => {        expect.objectContaining({

      fs.existsSync.mockReturnValue(true);          responseChannel: 'public',

      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['help'] }));          isPrivateMessage: false,

          sender: 'testUser',

      await handleCommandCommand({          services: mockServices

        args: 'enable ping',        })

        services: mockServices,      );

        context: mockContext,    });

        responseChannel: 'public'  });

      });

  describe('disable command', () => {

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(    it('should disable an enabled command', async () => {

        "ℹ️ Command 'ping' is already enabled",      const mockData = {

        expect.objectContaining({        disabledCommands: ['help']

          responseChannel: 'public',      };

          isPrivateMessage: false,

          sender: 'testUser',      fs.existsSync.mockReturnValue(true);

          services: mockServices      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        })

      );      await handleCommandCommand({

    });        args: 'disable ping',

  });        services: mockServices,

        context: mockContext,

  describe('disable command', () => {        responseChannel: 'public'

    it('should disable an enabled command', async () => {      });

      const mockData = {

        disabledCommands: ['help']      expect(fs.writeFileSync).toHaveBeenCalledWith(

      };        expect.stringContaining('data.json'),

        JSON.stringify({ disabledCommands: ['help', 'ping'] }, null, 2),

      fs.existsSync.mockReturnValue(true);        'utf8'

      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));      );



      await handleCommandCommand({      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

        args: 'disable ping',        mockContext.bot,

        services: mockServices,        mockContext.msg.id,

        context: mockContext,        "✅ Command 'ping' has been disabled",

        responseChannel: 'public'        'public'

      });      );

    });

      expect(fs.writeFileSync).toHaveBeenCalledWith(

        expect.stringContaining('data.json'),    it('should handle already disabled command', async () => {

        JSON.stringify({ disabledCommands: ['help', 'ping'] }, null, 2),      fs.existsSync.mockReturnValue(true);

        'utf8'      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['ping'] }));

      );

      await handleCommandCommand({

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(        args: 'disable ping',

        "✅ Command 'ping' has been disabled",        services: mockServices,

        expect.objectContaining({        context: mockContext,

          responseChannel: 'public',        responseChannel: 'public'

          isPrivateMessage: false,      });

          sender: 'testUser',

          services: mockServices      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

        })        mockContext.bot,

      );        mockContext.msg.id,

    });        "ℹ️ Command 'ping' is already disabled",

        'public'

    it('should handle already disabled command', async () => {      );

      fs.existsSync.mockReturnValue(true);    });

      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['ping'] }));

    it('should prevent disabling unknown command', async () => {

      await handleCommandCommand({      fs.existsSync.mockReturnValue(true);

        args: 'disable ping',      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: [] }));

        services: mockServices,

        context: mockContext,      await handleCommandCommand({

        responseChannel: 'public'        args: 'disable unknown',

      });        services: mockServices,

        context: mockContext,

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(        responseChannel: 'public'

        "ℹ️ Command 'ping' is already disabled",      });

        expect.objectContaining({

          responseChannel: 'public',      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

          isPrivateMessage: false,        mockContext.bot,

          sender: 'testUser',        mockContext.msg.id,

          services: mockServices        "❌ Cannot disable the 'unknown' command as it handles unrecognized commands",

        })        'public'

      );      );

    });    });

  });

    it('should prevent disabling unknown command', async () => {

      fs.existsSync.mockReturnValue(true);  describe('status command', () => {

      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: [] }));    it('should show enabled status', async () => {

      fs.existsSync.mockReturnValue(true);

      await handleCommandCommand({      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['help'] }));

        args: 'disable unknown',

        services: mockServices,      await handleCommandCommand({

        context: mockContext,        args: 'status ping',

        responseChannel: 'public'        services: mockServices,

      });        context: mockContext,

        responseChannel: 'public'

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(      });

        "❌ Cannot disable the 'unknown' command as it handles unrecognized commands",

        expect.objectContaining({      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

          responseChannel: 'public',        mockContext.bot,

          isPrivateMessage: false,        mockContext.msg.id,

          sender: 'testUser',        "ℹ️ Command 'ping' is currently enabled",

          services: mockServices        'public'

        })      );

      );    });

    });

  });    it('should show disabled status', async () => {

      fs.existsSync.mockReturnValue(true);

  describe('status command', () => {      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['ping'] }));

    it('should show enabled status', async () => {

      fs.existsSync.mockReturnValue(true);      await handleCommandCommand({

      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['help'] }));        args: 'status ping',

        services: mockServices,

      await handleCommandCommand({        context: mockContext,

        args: 'status ping',        responseChannel: 'public'

        services: mockServices,      });

        context: mockContext,

        responseChannel: 'public'      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

      });        mockContext.bot,

        mockContext.msg.id,

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(        "ℹ️ Command 'ping' is currently disabled",

        "ℹ️ Command 'ping' is currently enabled",        'public'

        expect.objectContaining({      );

          responseChannel: 'public',    });

          isPrivateMessage: false,  });

          sender: 'testUser',

          services: mockServices  describe('error handling', () => {

        })    it('should require arguments', async () => {

      );      await handleCommandCommand({

    });        args: '',

        services: mockServices,

    it('should show disabled status', async () => {        context: mockContext,

      fs.existsSync.mockReturnValue(true);        responseChannel: 'public'

      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['ping'] }));      });



      await handleCommandCommand({      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

        args: 'status ping',        mockContext.bot,

        services: mockServices,        mockContext.msg.id,

        context: mockContext,        'Please specify an action: list, enable <command>, disable <command>, or status <command>',

        responseChannel: 'public'        'public'

      });      );

    });

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

        "ℹ️ Command 'ping' is currently disabled",    it('should require command name for enable/disable/status', async () => {

        expect.objectContaining({      await handleCommandCommand({

          responseChannel: 'public',        args: 'enable',

          isPrivateMessage: false,        services: mockServices,

          sender: 'testUser',        context: mockContext,

          services: mockServices        responseChannel: 'public'

        })      });

      );

    });      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

  });        mockContext.bot,

        mockContext.msg.id,

  describe('error handling', () => {        'Please specify a command name',

    it('should require arguments', async () => {        'public'

      await handleCommandCommand({      );

        args: '',    });

        services: mockServices,

        context: mockContext,    it('should handle non-existent commands', async () => {

        responseChannel: 'public'      fs.existsSync.mockReturnValue(false);

      });

      await handleCommandCommand({

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(        args: 'enable nonexistent',

        'Please specify an action: list, enable <command>, disable <command>, or status <command>',        services: mockServices,

        expect.objectContaining({        context: mockContext,

          responseChannel: 'public',        responseChannel: 'public'

          isPrivateMessage: false,      });

          sender: 'testUser',

          services: mockServices      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

        })        mockContext.bot,

      );        mockContext.msg.id,

    });        "❌ Command 'nonexistent' does not exist",

        'public'

    it('should require command name for enable/disable/status', async () => {      );

      await handleCommandCommand({    });

        args: 'enable',

        services: mockServices,    it('should handle invalid actions', async () => {

        context: mockContext,      fs.existsSync.mockReturnValue(true);

        responseChannel: 'public'

      });      await handleCommandCommand({

        args: 'invalid ping',

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(        services: mockServices,

        'Please specify a command name',        context: mockContext,

        expect.objectContaining({        responseChannel: 'public'

          responseChannel: 'public',      });

          isPrivateMessage: false,

          sender: 'testUser',      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

          services: mockServices        mockContext.bot,

        })        mockContext.msg.id,

      );        "❌ Invalid action 'invalid'. Use: list, enable, disable, or status",

    });        'public'

      );

    it('should handle non-existent commands', async () => {    });

      fs.existsSync.mockReturnValue(false);

    it('should handle file system errors gracefully', async () => {

      await handleCommandCommand({      fs.existsSync.mockReturnValue(true);

        args: 'enable nonexistent',      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['ping'] }));

        services: mockServices,      fs.writeFileSync.mockImplementation(() => {

        context: mockContext,        throw new Error('File write error');

        responseChannel: 'public'      });

      });

      await handleCommandCommand({

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(        args: 'enable ping',

        "❌ Command 'nonexistent' does not exist",        services: mockServices,

        expect.objectContaining({        context: mockContext,

          responseChannel: 'public',        responseChannel: 'public'

          isPrivateMessage: false,      });

          sender: 'testUser',

          services: mockServices      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(

        })        mockContext.bot,

      );        mockContext.msg.id,

    });        '❌ An error occurred while managing the command',

        'public'

    it('should handle invalid actions', async () => {      );

      fs.existsSync.mockReturnValue(true);      

      // Restore the mock

      await handleCommandCommand({      fs.writeFileSync.mockReturnValue();

        args: 'invalid ping',    });

        services: mockServices,  });

        context: mockContext,});
        responseChannel: 'public'
      });

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        "❌ Invalid action 'invalid'. Use: list, enable, disable, or status",
        expect.objectContaining({
          responseChannel: 'public',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        })
      );
    });

    it('should handle file system errors gracefully', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ disabledCommands: ['ping'] }));
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('File write error');
      });

      await handleCommandCommand({
        args: 'enable ping',
        services: mockServices,
        context: mockContext,
        responseChannel: 'public'
      });

      expect(mockServices.messageService.sendResponse).toHaveBeenCalledWith(
        '❌ An error occurred while managing the command',
        expect.objectContaining({
          responseChannel: 'public',
          isPrivateMessage: false,
          sender: 'testUser',
          services: mockServices
        })
      );
      
      // Restore the mock
      fs.writeFileSync.mockReturnValue();
    });
  });
});