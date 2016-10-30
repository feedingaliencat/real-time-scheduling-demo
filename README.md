In build, you can find the compiled version of the last release.

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
