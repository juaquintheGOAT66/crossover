const log = require( './log' )
const set = require( './set' )
const windows = require( './windows' )
const register = require( './register' )
const ipc = require( './ipc' )
const crossover = require( './crossover' )
const { checkboxTrue } = require( '../config/utils' )
const { ipcMain } = require( 'electron' )
const preferences = require( './preferences' ).init()

const init = async options => {

	// Cleanup (if reset)
	// TODO explicitly remove channels
	// ipcMain.removeAllListeners()

	// Todo see if this conditional is needed to prevent multiple ipc
	if ( options?.triggeredByReset ) {

		windows.center()

	} else {

		// First boot
		// IPC
		ipc.init()

	}

	log.info( 'Init' )

	// Reset some preferences for app startup
	preferences.value( 'hidden.showSettings', false )
	preferences.value( 'hidden.tilted', false )

	// Start unlocked?
	if ( checkboxTrue( preferences.value( 'app.startUnlocked' ), 'startUnlocked' ) ) {

		preferences.value( 'hidden.locked', false )

	}

	// Sync Settings
	crossover.syncSettings()

	// App centered by default - set position if exists
	if ( preferences.value( 'hidden.positionX' ) !== null && typeof preferences.value( 'hidden.positionX' ) !== 'undefined' ) {

		// Todo: do not set invalid bounds
		set.position( preferences.value( 'hidden.positionX' ), preferences.value( 'hidden.positionY' ) )

	}

	// Set lock state, timeout makes it pretty
	setTimeout( () => {

		// Todo: We shouldn't need a timeout here
		// Keyboard shortcuts - delay fixes an unbreakable loop on reset, continually triggering resets
		crossover.registerKeyboardShortcuts()

		// Show or hide window
		crossover.lockWindow( preferences.value( 'hidden.locked' ) )

	}, 500 )

	// Spawn chooser window (if resetting it may exist)
	if ( !windows.chooserWindow ) {

		await windows.createChooser( preferences.value( 'crosshair.crosshair' ) )

	}

	// Window Events after windows are created
	register.events()

	ipcMain.once( 'init', () => {

		console.log( 'INIT TRIGGERED' )
		init( { triggeredByReset: true } )

	} )

}

module.exports = init