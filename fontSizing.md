> ✏️ **dynamic font sizing** so that the **text always scales to fit within a container of height `100vh`**, making it responsive and as large as possible *without overflowing* — especially important on mobile.
    
## ✅ Option 1: `clamp()` with `vh` for scalable, responsive text
    
```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        html, body {
          height: 100%;
          margin: 0;
        }
        .container {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 1rem;
        }
    
        .content {
          font-size: clamp(1rem, 10vh, 10vw); /* Dynamically scales based on viewport size */
          line-height: 1.1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          This text scales to always fit the screen.
        </div>
      </div>
    </body>
    </html>
```
    
## ✅ Option 2: Use JavaScript to calculate and apply font size dynamically (for pixel-perfect fit)    
    
If you want the **text to *exactly* fill the height**, not just scale roughly, use JavaScript to measure container and scale the text:
    
```html
    <script>
      function fitText() {
        const container = document.querySelector('.container');
        const content = document.querySelector('.content');
    
        let fontSize = 100;
        content.style.fontSize = fontSize + 'px';
    
        while (content.scrollHeight > container.clientHeight && fontSize > 10) {
          fontSize--;
          content.style.fontSize = fontSize + 'px';
        }
      }
    
      window.addEventListener('resize', fitText);
      window.addEventListener('load', fitText);
    </script>
```

## ✅ Option 3: Using `fitty`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fitty Text Example</title>
  <style>
    html, body {
      margin: 0;
      height: 100%;
    }

    .container {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      text-align: center;
    }

    .fit-text {
      width: 100%;
      max-width: 90%;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="fit-text">Responsive, Fitted Text</h1>
  </div>

  <!-- Fitty CDN -->
  <script src="https://cdn.jsdelivr.net/npm/fitty@2.3.6/dist/fitty.min.js"></script>

  <script>
    fitty('.fit-text', {
      minSize: 16,
      maxSize: 200
    });
  </script>
</body>
</html>
```
