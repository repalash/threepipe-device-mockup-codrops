import {
  CameraViewPlugin, CanvasSnapshotPlugin,
  ContactShadowGroundPlugin,
  IObject3D, ITexture,
  LoadingScreenPlugin, PhysicalMaterial,
  PickingPlugin,
  PopmotionPlugin, SRGBColorSpace,
  ThreeViewer,
  timeout,
  TransformAnimationPlugin,
  TransformControlsPlugin,
} from 'threepipe'
import {TweakpaneUiPlugin} from '@threepipe/plugin-tweakpane'

async function init() {
  const viewer = new ThreeViewer({
    canvas: document.getElementById('threepipe-canvas') as HTMLCanvasElement,
    msaa: false,
    renderScale: 'auto',
    dropzone: {
      allowedExtensions: ['png', 'jpeg', 'jpg', 'webp', 'svg', 'hdr', 'exr'],
      autoImport: true,
      addOptions: {
        disposeSceneObjects: false,
        autoSetBackground: false,
        autoSetEnvironment: true, // when hdr, exr is dropped
      },
    },
    plugins: [LoadingScreenPlugin, PickingPlugin, PopmotionPlugin,
      CameraViewPlugin, TransformAnimationPlugin,
      new TransformControlsPlugin(false),
      CanvasSnapshotPlugin,
      ContactShadowGroundPlugin],
  })

  const ui = viewer.addPluginSync(new TweakpaneUiPlugin(true))

  // Model configured in the threepipe editor with Camera Views and Transform Animations, check the tutorial to learn more.
  // Includes Models from Sketchfab by timblewee and polyman Studio and HDR from polyhaven/threejs.org
  // https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7
  // https://sketchfab.com/3d-models/macbook-pro-13-inch-2020-efab224280fd4c3993c808107f7c0b38
  const devices = await viewer.load<IObject3D>('./models/tabletop_macbook_iphone.glb')
  if (!devices) return

  const macbook = devices.getObjectByName('macbook')!
  const iphone = devices.getObjectByName('iphone')!

  const macbookScreen = macbook.getObjectByName('Bevels_2')!
  macbookScreen.name = 'Macbook Screen'

  // Canvas snapshot plugin can be used to download a snapshot of the canvas.
  ui.setupPluginUi(CanvasSnapshotPlugin, {expanded: false})
  // Add the object to the debug UI. The stored Transform objects can be seen and edited in the UI.
  ui.appendChild(macbookScreen.uiConfig, {expanded: false})
  ui.appendChild(iphone.uiConfig, {expanded: false})
  // Add the Camera View UI to the debug UI. The stored Camera Views can be seen and edited in the UI.
  ui.setupPluginUi(CameraViewPlugin, {expanded: false})
  ui.appendChild(viewer.scene.mainCamera.uiConfig)
  ui.setupPluginUi(TransformControlsPlugin, {expanded: true})

  // Listen to when an image is dropped and set it as the emissive map for the screens.
  viewer.assetManager.addEventListener('loadAsset', (e)=>{
    if (!e.data?.isTexture) return
    const texture = e.data as ITexture
    texture.colorSpace = SRGBColorSpace
    // The file has different objects that have the material.
    const mbpScreen = viewer.scene.getObjectByName('Object_7')?.material as PhysicalMaterial
    const iPhoneScreen = viewer.scene.getObjectByName('xXDHkMplTIDAXLN')?.material as PhysicalMaterial
    console.log(mbpScreen, iPhoneScreen)
    if(!mbpScreen || !iPhoneScreen) return
    mbpScreen.color.set(0,0,0)
    mbpScreen.emissive.set(1,1,1)
    mbpScreen.roughness = 0.2
    mbpScreen.metalness = 0.8
    mbpScreen.map = null
    mbpScreen.emissiveMap = texture
    iPhoneScreen.emissiveMap = texture
    mbpScreen.setDirty()
    iPhoneScreen.setDirty()
  })

  // Separate views are created in the file with different camera fields of view and positions to account for mobile screen.
  const isMobile = ()=>window.matchMedia('(max-width: 768px)').matches
  const viewName = (key: string) => isMobile() ? key + '2' : key

  const transformAnim = viewer.getPlugin(TransformAnimationPlugin)!
  const cameraView = viewer.getPlugin(CameraViewPlugin)!

  const picking = viewer.getPlugin(PickingPlugin)!
  // Disable widget(3D bounding box) in the Picking Plugin (enabled by default)
  picking.widgetEnabled = false
  // Enable hover events in the Picking Plugin (disabled by default)
  picking.hoverEnabled = true

  // Set initial state
  await transformAnim.animateTransform(macbookScreen, 'closed', 50)?.promise
  await transformAnim.animateTransform(iphone, 'facedown', 50)?.promise
  await cameraView.animateToView(viewName('start'), 50)

  // Track the current and the next state.
  const state = {
    focused: '',
    hover: '',
    animating: false,
  }
  const nextState = {
    focused: '',
    hover: '',
  }
  async function updateState() {
    if (state.animating) return
    const next = nextState
    if (next.focused === state.focused && next.hover === state.hover) return
    state.animating = true
    const isOpen = state.focused
    Object.assign(state, next)
    if (state.focused) {
      await Promise.all([
        transformAnim.animateTransform(macbookScreen, state.focused === 'macbook' ? 'open' : 'closed', 500)?.promise,
        transformAnim.animateTransform(iphone, state.focused === 'iphone' ? 'floating' : 'facedown', 500)?.promise,
        cameraView.animateToView(viewName(state.focused === 'macbook' ? 'macbook' : 'iphone'), 500),
      ])
    } else if (state.hover) {
      await Promise.all([
        transformAnim.animateTransform(macbookScreen, state.hover === 'macbook' ? 'hover' : 'closed', 250)?.promise,
        transformAnim.animateTransform(iphone, state.hover === 'iphone' ? 'tilted' : 'facedown', 250)?.promise,
      ])
    } else {
      const duration = isOpen ? 500 : 250
      await Promise.all([
        transformAnim.animateTransform(macbookScreen, 'closed', duration)?.promise,
        transformAnim.animateTransform(iphone, 'facedown', duration)?.promise,
        isOpen ? cameraView.animateToView(viewName('front'), duration) : null,
      ])
    }
    state.animating = false
  }
  async function setState(next: typeof nextState) {
    Object.assign(nextState, next)
    while (state.animating) await timeout(50)
    await updateState()
  }

  function deviceFromHitObject(object: IObject3D) {
    let device = ''
    object.traverseAncestors(o => {
      if (o === macbook) device = 'macbook'
      if (o === iphone) device = 'iphone'
    })
    return device
  }

  // Fired when the current hover object changes.
  picking.addEventListener('hoverObjectChanged', async(e) => {
    const object = e.object as IObject3D
    if (!object) {
      if (state.hover && !state.focused) await setState({hover: '', focused: ''})
      return
    }
    if (state.focused) return
    const device = deviceFromHitObject(object)
    await setState({hover: device, focused: ''})
  })

  // Fired when the user clicks on the canvas.
  picking.addEventListener('hitObject', async(e) => {
    const object = e.intersects.selectedObject as IObject3D
    if (!object) {
      if (state.focused) await setState({hover: '', focused: ''})
      return
    }
    const device = deviceFromHitObject(object)
    // change the selected object for transform controls.
    e.intersects.selectedObject = device === 'macbook' ? macbook : iphone
    await setState({focused: device, hover: ''})
  })

  // Close all devices when the user presses the Escape key.
  document.addEventListener('keydown', (ev)=>{
    if (ev.key === 'Escape' && state.focused) setState({hover: '', focused: ''})
  })

}

init()
