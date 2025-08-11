# RPG styled note based leveling system

Creates quests and achievements instead of plain notes and gain experience points while gaining knowledge. A status page summarizes quests and achievements in the users vault. 

The ribbon in Obsidian's UI gets a new button depicting three pillars which allow the user to take their first steps to leveling up. 

This project uses TypeScript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in TypeScript Definition format, which contains TSDoc comments describing what it does. 

## How to use

- Activate the plugin and go select the plugin in the Community Plugins section. Fill in the "Classes" category with possible specializations you plan to pursue.
- In the ribbon on the left side of the Obsidian intergace now has a bar chart icon. Left click to see your status page although it will not have any quests or achievements until you add them.
- A right click on the icon will open a menu at the click with the choice to make a new quest or achievement.
- When a new quest or achievement is made fill in its properties, make sure the "Class" property is filled in with a class that has been added to the plugin settings.
- It is recommended to assign the "Complete by" property to something even if the quest/achievement does not have a deadline. Uncompleted quests and achievements past the deadline are not shown on the status view.
- Tasks help decide whether a quest/achievement is complete. They are complete when all tasks in the note have been checked (automatically marked complete when the note has no tasks). The Status Page displays uncompleted quests and achievements with their tasks and their status can be changed from the status page.
  




