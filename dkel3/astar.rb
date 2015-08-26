#! /usr/bin/env ruby

require 'pry'

DEBUG = false

# create a list node with the given position, score, and path and add it to the
# priority queue
def add_with_path list, pos, score, path
  list.push ({position: pos, score: score, path: path})
end

# treat list as priority queue on :score and get the next item
def get_next list
  if list.length < 1 then nil end

  nxt = list[0]
  list.each do |item|
    if item[:score] < nxt[:score] then
      nxt = item
    end
  end

  nxt
end

# manhattan distance
def dist p1, p2
  (p2[0] - p1[0]).abs + (p2[1] - p1[1]).abs
end

# return position of the neigbor to node in the given dir
# uses dims to determine edge of board
def nbor node, dims, dir
  if (dir == :north && node[1] > 0) then return [node[0], node[1]-1] end
  if (dir == :south && node[1] < dims[1] - 1) then return [node[0], node[1]+1] end
  if (dir == :east && node[0] < dims[0] - 1) then return [node[0]+1, node[1]] end
  if (dir == :west && node[0] > 0) then return [node[0]-1, node[1]] end

  nil
end

# return map of neighbors and directions
def nbors node, dims
  [:north, :south, :east, :west].map { |dir| {dir: dir, node: nbor( node, dims, dir )} }
                                .reject { |i| i[:node] == nil }
end

def node_type board, node
  type = board[ node[1] ][ node[0] ]

  if type == 'S' then return :start end
  if type == '-' then return :empty end
  if type == 'X' || type == 'x' then return :wall end
  if type == 'F' then return :finish end

  nil
end

def is_wall board, pos
  return node_type( board, pos ) == :wall
end

# map of neighbors that aren't walls and their directions
def valid_nbors board, dims, pos
  nbors( pos, dims ).reject {|i| is_wall(board, i[:node])}
end

# convert path of symbols into correct output
def print_path path
  reverse = { north: 'N', south: 'S', east: 'E', west: 'W' }
  puts path.map { |i| reverse[i] }.join ""
end

board = []
start = []
finish = []

# build board and find start and finish
ARGF.each_with_index do |line, row|
  start_col = line.index 'S'
  if start_col then start = [start_col, row] end

  finish_col = line.index 'F'
  if finish_col then finish = [finish_col, row] end

  board.push line.chomp
end

width = board[0].length
height = board.length
dims = [width, height]

if DEBUG then puts "Dims: " + dims.to_s end
if DEBUG then puts "Start: " + start.to_s end
if DEBUG then puts "Finish: " + finish.to_s end

open_nodes = []
visited = []
add_with_path(open_nodes, start, dist(start, finish), [])

loop do
  # if we run out of nodes without finding finish, its unsolvable
  if open_nodes.length == 0 then
    puts "unsolvable"
    break
  end

  current = get_next( open_nodes )

  # are we done?
  # yes, print path:
  if node_type(board, current[:position]) == :finish then
    print_path current[:path]
    break
  end

  # nope:
  open_nodes.delete(current)
  visited.push( current[:position] )

  if DEBUG then puts "Checking " + current.to_s end

  nbors = valid_nbors( board, dims, current[:position] )
  if DEBUG then puts "Neighbors: " + nbors.to_s end

  # for each neighbor that we haven't visited, add it to the list of open nodes
  nbors.each do |nbor|
    if !visited.include? nbor[:node] then
      new_path = Array.new( current[:path] )
      add_with_path( open_nodes, nbor[:node], dist(nbor[:node], finish), new_path.push(nbor[:dir]) )
    end
  end

  if DEBUG then puts "Open: " + open_nodes.to_s end
end
