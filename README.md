# Dungeon Crawl Game
A challenge from freeCodeCamp to build a classic dungeon crawl game.

# Working Application
https://codepen.io/mookh01/full/NaxNvV

# Objective

User Story: I have health, a level, and a weapon. I can pick up a better weapon. I can pick up health items.

User Story: All the items and enemies on the map are arranged at random.

User Story: I can move throughout a map, discovering items.

User Story: I can move anywhere within the map's boundaries, but I can't move through an enemy until I've beaten it.

User Story: Much of the map is hidden. When I take a step, all spaces that are within a certain number of spaces from me are revealed.

User Story: When I beat an enemy, the enemy goes away and I get XP, which eventually increases my level.

User Story: When I fight an enemy, we take turns damaging each other until one of us loses. I do damage based off of my level and my weapon. The enemy does damage based off of its level. Damage is somewhat random within a range.

User Story: When I find and beat the boss, I win.

User Story: The game should be challenging, but theoretically winnable.

# Challenges:
This was a very challenging application; 
  - I had trouble coming up with a formula to generate rooms for the dugeon.
  - I was using Redux for the first time and there was a learning curve.
  
  I searched longer than I wanted to for a formula that would satisfy the requirement for random generation of rooms. I finally decided on a method that would use recursion. 
  Rooms would have to meet certain criteria before it was added to the list of rooms to generate. These formulas are simple in action but difficult to keep track of in my head. 
  It would be better if I used similar formulas more often to be proficient. 
  Having heard of and seeing a tutorial using Redux, I decided that I would attempt to learn the basics of Redux and apply it to the application.  
  I discovered that I needed focus fulltime on Redux before I could actually understand what it would be doing in the application. This set me back by a week. 
  I still need more work with Redux as of this date. Hopefully it will become as easy as many claim it to be. 
