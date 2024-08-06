# 3D Device Demo with Threepipe

Minimal 3D website to present designs, websites on a laptop and a phone in an interactive environment using [threepipe](https://threepipe.org).

Clone the repository and run the following commands to get started:

```bash
npm install
npm run dev
```

Navigate to `http://localhost:5173` to see the project in action.

## Introduction to Threepipe

[Threepipe](https://threepipe.org) is a new framework for creating 3D web applications using JavaScript or TypeScript. It provides a high-level API built on top of [Three.js](https://threejs.org), offering a more intuitive and efficient way to develop 3D experiences for the web. Threepipe comes with a plugin system(and a lot of built-in plugins), making it easy to extend functionality and integrate various features into your 3D projects.

In the tutorial, we'll create an interactive 3D device mockup showcase using Threepipe, featuring a MacBook and an iPhone model, where users can interact with the model with clicking and hovering over the objects, and drop images to display on the devices. Check out the [final version](https://codepen.io/repalash/full/ExBXvby).

Check the full tutorial on [codrops](https://tympanus.net/codrops/) - https://tympanus.net/codrops/?p=79929

## Next Steps

This tutorial covers the basics of creating an interactive 3D device mockup showcase using Threepipe. You can further enhance the project by adding more models, animations, and interactions. Extending the model can be done in both the editor or in the code.

Here are some ideas to extend the project:
- Add some post processing plugins like SSAO, SSR, etc to enhance the visuals.
- Create a custom environment map or use a different HDR image for the scene.
- Add more 3D models and create a complete 3D environment.
- Embed an iframe in the scene to display a website or a video directly on the device screens.
- Add video rendering to export 3d mockups of UI designs.
