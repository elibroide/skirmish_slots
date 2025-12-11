#!/bin/bash
echo "Checking if the dev server has any build errors..."
sleep 2
curl -s http://localhost:5173/@vite/client 2>&1 | head -5
echo ""
echo "Server is running at: http://localhost:5173/"
echo ""
echo "To test the game:"
echo "1. Open http://localhost:5173/ in your browser"
echo "2. Open DevTools (F12 or Cmd+Option+I)"
echo "3. Check the Console tab for any errors"
echo ""
echo "The game should display:"
echo "- Title: 'Skirmish'"
echo "- Player 0 hand with 8 cards at the bottom"
echo "- 4 empty slots in the middle"
echo "- Info panel on the right with VP and Round info"
