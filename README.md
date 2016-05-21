# Linkgua Semantic Video JavaScript Widget. (v1.0.0)

Bring Youtube over your texts. 


## Build
You must compile the  src/ files. 

### Architecture: 
- Based on ReactiveJs (http://www.ractivejs.org/)

### Dependencias
    - node
    - bower
    - grunt
    - ruby (for sass)
    
    
### Install Dependencies
```
  npm install
  bower install
  
```

### Watch mode for develop
```
  grunt dev
  
```

### build production widget
```
  grunt build
  
```


### Functionality
  - Widget Connection with Linkgua Semantic Api. 
  - Reveal relevant Peoples, Places, Concepts, Music, Films , etc.. on the selected text and Bring Youtube Video functionality over it.
  - Show Info related to the found entity. 
  
  
### How do you must include this widget ? 
 - You must add this code to the end of body page where you want the widget working. 
 - You must include your Linkgua Semantic Api/Token (get your free keys here https://www.linkgua-semantic.com ) 
 - If you use your own version of this plugin you need change the www.linkgua-semantic.com/widget/video/lks-video-plugin.min.js with your builded version.  
 
```html
  <script>
      window.lksConfig = {
          client_key : ':yourKey',
          client_token : ':yourToken',
          lks_text_container : ':cssSelectorForTheTextYouWantAnnotate', //any text on your page that you want use with the widget. (ex. .container )
          confidence : '0.4', 
          document_title: document.title,
          document_url: window.location.href
      };
  
      (function(l,i,n,k,g,u,a){
          a=l.createElement(i); a.type ='text/javascript'; a.async=1;
          a.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + n; g = l.getElementsByTagName(i)[0]; g.parentNode.insertBefore(a,g)
      })(document,'script','www.linkgua-semantic.com/widget/video/lks-video-plugin.min.js'); // builded plgugin url.
  </script>
   
```

### Demo:
https://www.linkgua-semantic.com/demo/videowidget

### Widget Documentation:
https://www.linkgua-semantic.com/docs/videowidget

### Linkgua Semantic Api Documentation: 
https://www.linkgua-semantic.com/docs/

