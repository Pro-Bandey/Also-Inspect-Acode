# Acode Plugin Development Guide

## **Code of Conduct for Contributors**

Hello, contributors! Welcome to my GitHub repositories. To maintain a healthy and respectful environment for everyone, please follow this code of conduct:

1. **Respect:** Treat all contributors with respect and courtesy. Do not make offensive, discriminatory, or harmful comments.

2. **Inclusion:** We value a diversity of ideas and experiences. Be inclusive and welcoming to people from all backgrounds.

3. **Collaboration:** I encourage constructive collaboration. Share ideas, suggest improvements, and be willing to help other contributors.

4. **Licenses and Rights:** Respect open-source project licenses. Ensure you have the necessary rights to contribute code or content.

5. **Respectful Communication:** Maintain transparent and respectful communication. Use appropriate language and avoid unnecessary conflicts.

6. **Focus on Code:** Keep discussions related to the project and code. Avoid unrelated conversations.

7. **Reporting:** If you witness inappropriate behavior or violations of this code, report it to me via email at sebastianjnuwu@gmail.com. All reports will be taken seriously and handled confidentially.

8. **Consequences:** Serious violations of this code may result in the removal of contributors or contributions.

Please note that this code of conduct aims to create a friendly and productive environment. Thank you for being a contributor to this project. Together, we can achieve great results!

## Project Structure

A typical Acode plugin repository contains files similar to the following:

```
./
└── 📁.acode/
|    ├── build.js #build plugin zip in root/dist/pluginName.zip
|    ├── dev.js #run dev server at 2000 port and auto open <url>:2000/dev/ in browser
|    └── publish.js #publish pluginName.zip to acode site if zip exist in dist/ folder else generate new and publish
└── 📁dev/
|    ├── index.html #acode link interface that help user to test plugin in GUI
|    └── main.js #output js file for dev testing
└── 📁dist/
    └── pluginName.zip #output zip file of plugin
└── 📁src/
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

Your project may include additional folders depending on the build system.

---

# Development Workflow

A recommended workflow is:

1. Clone or fork the repository.
2. Install dependencies.
3. Start development mode.
4. Test inside Acode.
5. Build production files.
6. Test the production build.
7. Release.

Never publish code that has not been tested inside Acode.

---

# Common Commands

The exact commands depend on the repository, but most plugins use something similar to:

```bash
npm install
```

Install project dependencies.

---

```bash
npm run dev
```

Start development mode.

---

```bash
npm run build
```

Create a production build.

```bash
npm run publish
```

Publishing new/Update production build to [Acode.app](https://Acode.app/).

---

```bash
npm run lint
```

Run linting (if configured).

---

```bash
npm test
```

Run tests (if available).

---

# Development Guidelines

## Keep Code Modular

Avoid putting everything into one file.

Instead:

- separate utilities
- separate UI logic
- separate plugin lifecycle
- separate API wrappers

Small modules are easier to maintain.

---

## Keep Functions Small

Prefer functions that perform a single responsibility.

Good:

- initialize plugin
- create sidebar
- load settings
- register commands

instead of one large initialization function.

---

## Avoid Global State

Keep shared state minimal.

Instead of attaching data to global objects, keep state inside modules whenever possible.

---

## Handle Errors

Never silently ignore errors.

Instead:

- catch expected failures
- show meaningful messages
- log useful debugging information

---

## Clean Up Resources

Always dispose resources created by your plugin.

Examples:

- event listeners
- timers
- observers
- intervals
- editor handlers

A plugin should leave no resources behind after unloading.

---

## Optimize Performance

Avoid:

- unnecessary DOM updates
- repeated expensive operations
- blocking the UI thread
- duplicate event listeners

Cache values when appropriate.

---

## Keep Dependencies Minimal

Only install packages that are actually required.

Smaller plugins:

- install faster
- build faster
- are easier to maintain

---

## Follow Acode APIs

Always use the documented Acode APIs whenever possible.

Avoid relying on undocumented internal behavior, as it may change between releases.

---

# Before Building

Before creating a production build, verify that:

- no debug logs remain
- unused files are removed
- unused dependencies are removed
- plugin metadata is updated
- version number is correct

---

# Before Publishing

Make sure:

- plugin installs correctly
- plugin loads correctly
- plugin unloads correctly
- settings work
- commands work
- UI works on supported devices

---

# Code Review

Every significant change should be reviewed before release.

A second review often finds issues that are easy to miss during development.

---

# AI-Assisted Code Review

AI can be useful **as a reviewer**

Before building or publishing your plugin, consider asking an AI to review only the code you've changed.

Example prompt:

> Review the following code for:
>
> - security issues
> - memory leaks
> - performance problems
> - incorrect Acode plugin usage
> - maintainability
> - edge cases
>
> Explain each issue and suggest improvements without rewriting unrelated code.

The goal is to receive feedback and identify potential problems—not to replace your understanding of the code. Always review AI suggestions before applying them.

---

# Final Checklist

Before releasing your plugin:

- [ ] Project builds successfully
- [ ] Plugin loads in Acode
- [ ] Plugin unloads cleanly
- [ ] No console errors
- [ ] No unused dependencies
- [ ] Version updated
- [ ] README updated
- [ ] Code reviewed
- [ ] AI review completed (optional)
- [ ] Final manual testing completed
