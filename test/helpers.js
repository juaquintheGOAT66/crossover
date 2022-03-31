const { ElectronApplication, Page, _electron: electron } = require( 'playwright' )
const { expect, test } = require( '@playwright/test' )

const wait = ms => new Promise( r => setTimeout( r, ms ) )

const startApp = async () => {

	// // Find the latest build in the out directory
	// const latestBuild = findLatestBuild()
	// // Parse the directory and find paths and other info
	// const appInfo = parseElectronApp( latestBuild )
	// Set the CI environment variable to true
	// process.env.CI = 'e2e'
	// electronApp = await electron.launch( {
	// 	args: [ appInfo.main ],
	// 	executablePath: appInfo.executable,
	// } )

	process.env.CI = 'e2e'

	const electronApp = await electron.launch( { args: [ '.' ] } )

	electronApp.on( 'window', async page => {

		const filename = page.url()?.split( '/' ).pop()
		console.log( `Window opened: ${filename}; File: ${page.isFile}` )

		// Capture errors
		page.on( 'pageerror', error => {

			console.error( error )

		} )
		// Capture console messages
		page.on( 'console', message => {

			console.warn( message )

		} )

	} )

	const mainWindow = await electronApp.firstWindow()
	const windows = await electronApp.windows
	// Await mainWindow.screenshot( {
	// 	path: 'test/screenshots/start.png',
	// } )

	return { electronApp, mainWindow, windows }

}

// This injects a box into the page that moves with the mouse;
// via https://github.com/puppeteer/puppeteer/issues/4378#issuecomment-499726973
function visualMouseCode() {

	console.log( '*VISUAL MOUSE*' )
	const box = document.createElement( 'puppeteer-mouse-pointer' )
	const styleElement = document.createElement( 'style' )
	styleElement.innerHTML = `
        puppeteer-mouse-pointer {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10000;
          left: 0;
          width: 10px;
          height: 10px;
          background: rgba(0,0,0,.4);
          border: 1px solid white;
          border-radius: 10px;
          margin: -10px 0 0 -10px;
          padding: 0;
          transition: background .2s, border-radius .2s, border-color .2s;
        }
        puppeteer-mouse-pointer.button-1 {
          transition: none;
          background: rgba(0,0,0,0.9);
        }
        puppeteer-mouse-pointer.button-2 {
          transition: none;
          border-color: rgba(0,0,255,0.9);
        }
        puppeteer-mouse-pointer.button-3 {
          transition: none;
          border-radius: 4px;
        }
        puppeteer-mouse-pointer.button-4 {
          transition: none;
          border-color: rgba(255,0,0,0.9);
        }
        puppeteer-mouse-pointer.button-5 {
          transition: none;
          border-color: rgba(0,255,0,0.9);
        }
      `
	document.head.append( styleElement )
	document.body.append( box )
	document.addEventListener( 'mousemove', event => {

		box.style.left = event.pageX + 'px'
		box.style.top = event.pageY + 'px'
		updateButtons( event.buttons )

	}, true )
	document.addEventListener( 'mousedown', event => {

		updateButtons( event.buttons )
		box.classList.add( 'button-' + event.which )

	}, true )
	document.addEventListener( 'mouseup', event => {

		updateButtons( event.buttons )
		box.classList.remove( 'button-' + event.which )

	}, true )
	function updateButtons( buttons ) {

		for ( let i = 0; i < 5; i++ ) {

			box.classList.toggle( 'button-' + i, buttons & ( 1 << i ) )

		}

	}

}

const visualMouse = async mainWindow => {

	await mainWindow.addScriptTag( { content: `${visualMouseCode}` } )
	await mainWindow.evaluate( async () => {

		await visualMouseCode()

	} )

}

module.exports = { startApp, visualMouse, wait }
