# Example

```
const { print } = require('simple-node-ui');

print(`
  <style:bgCyan,black width:30 align:center>
  "width"

  <nl:2 style:reset leftSpace:.1 width:min>
  "min (default)"<style:cyan nl>
  "Sets the width to the length of the string"
  
  <nl:2 style:reset leftSpace:.1>
  "max"<style:cyan nl>
  "Sets the width to terminal width"

  <nl:2 style:reset leftSpace:.1>
  "n"<style:cyan width:min nl>
  "Sets the width to n characters"

  <nl:2 style:reset leftSpace:.1>
  "n (0-1)"<style:cyan nl>
  "Any number between 0 and 1 is a percent of the terminal width"



  <nl:2 style:bgCyan,black width:30 align:center leftSpace:0>
  "align"

  <nl:2 style:reset leftSpace:.1 width:min>
  "left (default)"<style:cyan nl>
  "Sets alignment to the left"
  
  <nl:2 style:reset leftSpace:.1>
  "right"<style:cyan nl>
  "Sets alignment to the right"

  <nl:2 style:reset leftSpace:.1>
  "center"<style:cyan nl>
  "Sets alignment to the center"



  <nl:2 style:bgCyan,black width:30 align:center leftSpace:0>
  "emptyChar"

  <nl:2 style:reset leftSpace:.1 width:min>
  "When the width is greater than the strings length the remaining"<nl>
  "width is filled with emptyChar."



  <nl:2 style:bgCyan,black width:30 align:center leftSpace:0>
  "leftSpace / rightSpace"

  <nl:2 style:reset leftSpace:.1 width:min>
  "n"<style:cyan nl>
  "Adds space to the left/right side by n characters"

  <nl:2 style:reset leftSpace:.1 width:min>
  "n (0-1)"<style:cyan nl>
  "Adds space to the left/right side by n percent of the window"

  <nl:2 style:bgCyan,black width:30 align:center leftSpace:0>
  "style"

  <nl:2 style:reset leftSpace:.1 width:min>
  "FORMATS"
  <style:cyan leftSpace:.15>
  <nl>"reset"
  <nl>"bright"
  <nl>"dim"
  <nl>"underscore"
  <nl>"blink"
  <nl>"reverse"
  <nl>"hidden"

  <nl:2 style:reset leftSpace:.1 width:min>
  "COLORS"
  <style:cyan leftSpace:.15>
  <nl>"red"
  <nl>"green"
  <nl>"black"
  <nl>"yellow"
  <nl>"blue"
  <nl>"magenta"
  <nl>"cyan"
  <nl>"white"

  <nl:2 style:reset leftSpace:.1 width:min>
  "BACKGROUND COLORS"
  <style:cyan leftSpace:.15>
  <nl>"bgBlack"
  <nl>"bgRed"
  <nl>"bgGreen"
  <nl>"bgYellow"
  <nl>"bgBlue"
  <nl>"bgMagenta"
  <nl>"bgCyan"
  <nl>"bgWhite"

  <nl:2>
`);
```

## Output
```
width            

          min (default)
          Sets the width to the length of the string

          max
          Sets the width to terminal width

          n
          Sets the width to n characters

          n (0-1)
          Any number between 0 and 1 is a percent of the terminal width

align            

          left (default)
          Sets alignment to the left

          right
          Sets alignment to the right

          center
          Sets alignment to the center

         emptyChar          

          When the width is greater than the strings length the remaining
          width is filled with emptyChar.

leftSpace / rightSpace   

          n
          Adds space to the left/right side by n characters

          n (0-1)
          Adds space to the left/right side by n percent of the window

style            

          Multiple styles should be separated by commas, ie style:reset,black,bgWhite

          FORMATS
               reset
               bright
               dim
               underscore
               blink
               reverse
               hidden

          COLORS
               red
               green
               black
               yellow
               blue
               magenta
               cyan
               white

          BACKGROUND COLORS
               bgBlack
               bgRed
               bgGreen
               bgYellow
               bgBlue
               bgMagenta
               bgCyan
               bgWhite



```
