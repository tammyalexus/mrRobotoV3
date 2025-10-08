const handleFeatureCommand = require( '../../src/commands/handleFeatureCommand' );

describe( 'handleFeatureCommand', () => {
  let services;
  let message;

  beforeEach( () => {
    message = {
      userId: 'user123'
    };

    services = {
      featuresService: {
        isFeatureEnabled: jest.fn(),
        enableFeature: jest.fn(),
        disableFeature: jest.fn(),
        getAllFeatures: jest.fn()
      },
      messageService: {
        groupMessage: jest.fn()
      },
      stateService: {
        getUserRole: jest.fn()
      }
    };
  } );

  describe( 'permission checking', () => {
    it( 'should allow owners to use feature command', async () => {
      services.stateService.getUserRole.mockReturnValue( 'owner' );
      services.featuresService.getAllFeatures.mockReturnValue( {
        enabled: ['welcomeMessage'],
        disabled: ['nowPlayingMessage']
      } );

      await handleFeatureCommand( message, 'list', [], services );

      expect( services.messageService.groupMessage ).toHaveBeenCalled();
    } );

    it( 'should deny access to moderators', async () => {
      services.stateService.getUserRole.mockReturnValue( 'moderator' );

      await handleFeatureCommand( message, 'list', [], services );

      expect( services.messageService.groupMessage ).toHaveBeenCalledWith(
        'Only the room owner can manage features.'
      );
    } );

    it( 'should deny access to regular users', async () => {
      services.stateService.getUserRole.mockReturnValue( 'user' );

      await handleFeatureCommand( message, 'list', [], services );

      expect( services.messageService.groupMessage ).toHaveBeenCalledWith(
        'Only the room owner can manage features.'
      );
    } );
  } );

  describe( 'list command', () => {
    beforeEach( () => {
      services.stateService.getUserRole.mockReturnValue( 'owner' );
    } );

    it( 'should display enabled and disabled features', async () => {
      services.featuresService.getAllFeatures.mockReturnValue( {
        enabled: ['welcomeMessage'],
        disabled: ['nowPlayingMessage']
      } );

      await handleFeatureCommand( message, 'list', [], services );

      const expectedMessage = 'Available Features:\n\n✅ Enabled:\n- welcomeMessage\n\n❌ Disabled:\n- nowPlayingMessage\n';
      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( expectedMessage );
    } );

    it( 'should handle all features enabled', async () => {
      services.featuresService.getAllFeatures.mockReturnValue( {
        enabled: ['welcomeMessage', 'nowPlayingMessage'],
        disabled: []
      } );

      await handleFeatureCommand( message, 'list', [], services );

      const expectedMessage = 'Available Features:\n\n✅ Enabled:\n- welcomeMessage\n- nowPlayingMessage\n\n❌ Disabled:\n(none)';
      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( expectedMessage );
    } );

    it( 'should handle all features disabled', async () => {
      services.featuresService.getAllFeatures.mockReturnValue( {
        enabled: [],
        disabled: ['welcomeMessage', 'nowPlayingMessage']
      } );

      await handleFeatureCommand( message, 'list', [], services );

      const expectedMessage = 'Available Features:\n\n✅ Enabled:\n(none)\n\n❌ Disabled:\n- welcomeMessage\n- nowPlayingMessage\n';
      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( expectedMessage );
    } );
  } );

  describe( 'enable command', () => {
    beforeEach( () => {
      services.stateService.getUserRole.mockReturnValue( 'owner' );
    } );

    it( 'should enable a feature successfully', async () => {
      services.featuresService.enableFeature.mockReturnValue( true );

      await handleFeatureCommand( message, 'enable', ['welcomeMessage'], services );

      expect( services.featuresService.enableFeature ).toHaveBeenCalledWith( 'welcomeMessage' );
      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( 'Feature "welcomeMessage" has been enabled.' );
    } );

    it( 'should handle feature already enabled', async () => {
      services.featuresService.enableFeature.mockReturnValue( false );

      await handleFeatureCommand( message, 'enable', ['welcomeMessage'], services );

      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( 'Feature "welcomeMessage" is already enabled.' );
    } );

    it( 'should require feature name argument', async () => {
      await handleFeatureCommand( message, 'enable', [], services );

      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( 'Usage: !feature enable <featureName>' );
    } );
  } );

  describe( 'disable command', () => {
    beforeEach( () => {
      services.stateService.getUserRole.mockReturnValue( 'owner' );
    } );

    it( 'should disable a feature successfully', async () => {
      services.featuresService.disableFeature.mockReturnValue( true );

      await handleFeatureCommand( message, 'disable', ['welcomeMessage'], services );

      expect( services.featuresService.disableFeature ).toHaveBeenCalledWith( 'welcomeMessage' );
      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( 'Feature "welcomeMessage" has been disabled.' );
    } );

    it( 'should handle feature already disabled', async () => {
      services.featuresService.disableFeature.mockReturnValue( false );

      await handleFeatureCommand( message, 'disable', ['welcomeMessage'], services );

      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( 'Feature "welcomeMessage" is already disabled.' );
    } );

    it( 'should require feature name argument', async () => {
      await handleFeatureCommand( message, 'disable', [], services );

      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( 'Usage: !feature disable <featureName>' );
    } );
  } );

  describe( 'status command', () => {
    beforeEach( () => {
      services.stateService.getUserRole.mockReturnValue( 'owner' );
    } );

    it( 'should show enabled status', async () => {
      services.featuresService.isFeatureEnabled.mockReturnValue( true );

      await handleFeatureCommand( message, 'status', ['welcomeMessage'], services );

      expect( services.featuresService.isFeatureEnabled ).toHaveBeenCalledWith( 'welcomeMessage' );
      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( 'Feature "welcomeMessage" is currently enabled ✅.' );
    } );

    it( 'should show disabled status', async () => {
      services.featuresService.isFeatureEnabled.mockReturnValue( false );

      await handleFeatureCommand( message, 'status', ['welcomeMessage'], services );

      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( 'Feature "welcomeMessage" is currently disabled ❌.' );
    } );

    it( 'should require feature name argument', async () => {
      await handleFeatureCommand( message, 'status', [], services );

      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( 'Usage: !feature status <featureName>' );
    } );
  } );

  describe( 'invalid command', () => {
    beforeEach( () => {
      services.stateService.getUserRole.mockReturnValue( 'owner' );
    } );

    it( 'should show usage for unknown subcommand', async () => {
      await handleFeatureCommand( message, 'invalid', [], services );

      const expectedMessage = 'Usage: !feature <list|enable|disable|status> [featureName]\n\nExamples:\n!feature list\n!feature enable welcomeMessage\n!feature disable nowPlayingMessage\n!feature status welcomeMessage';
      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( expectedMessage );
    } );

    it( 'should show usage when no subcommand provided', async () => {
      await handleFeatureCommand( message, '', [], services );

      const expectedMessage = 'Usage: !feature <list|enable|disable|status> [featureName]\n\nExamples:\n!feature list\n!feature enable welcomeMessage\n!feature disable nowPlayingMessage\n!feature status welcomeMessage';
      expect( services.messageService.groupMessage ).toHaveBeenCalledWith( expectedMessage );
    } );
  } );
} );