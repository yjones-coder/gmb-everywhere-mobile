# How to Open gmb-everywhere-mobile as Workspace in VSCode

To enable KiloCode indexing, you need to open the `gmb-everywhere-mobile` folder as the workspace root (not as a subfolder of the SEO directory).

## Method 1: File Menu (Recommended)

1. In VSCode, go to **File** → **Open Folder...**
2. Navigate to `c:\Users\Ythan\SEO\gmb-everywhere-mobile`
3. Click **Select Folder**
4. VSCode will reload with gmb-everywhere-mobile as the workspace root

## Method 2: Command Palette

1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type "Open Folder"
3. Select **File: Open Folder...**
4. Navigate to `c:\Users\Ythan\SEO\gmb-everywhere-mobile`
5. Click **Select Folder**

## Method 3: Windows Explorer

1. Open Windows Explorer
2. Navigate to `c:\Users\Ythan\SEO\gmb-everywhere-mobile`
3. Right-click on the `gmb-everywhere-mobile` folder
4. Select **Open with Code** (if available)

## Method 4: Terminal/Command Line

Open a terminal and run:
```bash
cd c:\Users\Ythan\SEO\gmb-everywhere-mobile
code .
```

## After Opening

Once you've opened the folder as the workspace:

1. **Verify Git Repository**: Check the bottom-left corner of VSCode - you should see the git branch name (likely "main")
2. **Enable KiloCode Indexing**: 
   - Open KiloCode settings in VSCode
   - Enable "Managed Code Indexing" for this workspace
   - The error message should no longer appear
3. **Wait for Indexing**: Initial indexing will take ~30 seconds for 80+ files
4. **Test Semantic Search**: Try queries like:
   - "How does OAuth authentication work?"
   - "Show me the GMB API integration"
   - "Where is the business card component?"

## Troubleshooting

**If you still see the git repository error:**
- Make sure you're opening the `gmb-everywhere-mobile` folder itself, not the parent `SEO` folder
- Check that the `.git` folder exists in `gmb-everywhere-mobile` (it should, as we verified earlier)
- Try closing and reopening VSCode after selecting the folder

**If you want to work on multiple projects:**
- Use VSCode's **File** → **Add Folder to Workspace...** to create a multi-root workspace
- Save the workspace configuration for future use
- Each folder with a git repository can have its own KiloCode indexing configuration
