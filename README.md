1. Work through the grid row-wise, starting with the cell at 0,0. Initialize the “run” set to be empty.
2. Add the current cell to the “run” set.
3. For the current cell, randomly decide whether to carve east or not.
4. If a passage was carved, make the new cell the current cell and repeat steps 2-4.
5. If a passage was not carved, choose any one of the cells in the run set and carve a passage north. Then empty the run set, set the next cell in the row to be the current cell, and repeat steps 2-5.
6. Continue until all rows have been processed.