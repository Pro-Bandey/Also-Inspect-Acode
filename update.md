This my Aocde Plugin the open eruda devtools in acode when now i need to improve and enhanced


bleow is my folder structure
```
└── 📁SelectCDN/
    └── 📁.acode/
    |    ├── build.js #build plugin zip in root/dist/pluginName.zip
    |    ├── dev.js #run dev server at 2000 port and auto open <url>:2000/dev/ in browser
    |    └── publish.js #publish pluginName.zip to acode site if zip exist in dist/ folder else generate new and publish
    └── 📁dev/
    |    ├── index.html #acode link interface that help user to test plugin in GUI
    |    └── main.js #output js file for dev testing 
    └── 📁dist/
        └── pluginName.zip #output zip file of plugin
    └── 📁src/ #soucre of acode plugin
    |    ├── 📁files/
    |    |    └── ... #all plugin extra files that used by plugin
    |    ├── changelog.md #changelog of plugin that auto update on everynew changes in code when packing zip file
    |    ├── icon.png #icon of plugin
    |    ├── main.js #main js file that contain mainpipline source of plugin features & logics
    |    ├── plugin.json #acode plugin manifest json file
    |    └── readme.md #plugin README file
    ├── .gitignore
    ├── Code_Of_Conduct.md
    ├── LICENSE
    ├── package-lock.json
    ├── package.json
    ├── README.md #repo README file
```


> Dont Give Code yet