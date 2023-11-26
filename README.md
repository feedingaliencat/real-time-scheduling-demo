In docs, you can find the compiled version of the last release.
It is available at https://dartypier.github.io/real-time-scheduling-demo/build/

To build yourself the current source, instead, you'll need Pug:

```
npm install pug pug-cli
```
and add the current dir to $PATH, or install the package globally
```
npm install pug pug-cli -g
```

then
```
cd src
pug .
chromium index.html
```
#### Bug Fixed
This fork fixes the problem of the time overlap in the ouput canvas, giving the user the ability to adjust the size of the canvas.
