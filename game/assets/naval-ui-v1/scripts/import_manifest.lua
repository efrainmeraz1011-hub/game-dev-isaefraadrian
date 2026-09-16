-- Import PNG assets at their exact native pixels into a layered 1024x1024 atlas.
-- Invocation: aseprite -b --script-param root=/absolute/pack --script scripts/import_manifest.lua
-- Optional params: manifest=/absolute/manifest.json output=/absolute/file.aseprite
-- Atlas positions: all assets provide atlas_rect={x,y,w,h}, or atlas={x=...,y=...},
-- or no assets provide positions (a 4px-gutter shelf pack will be computed).

local root = assert(app.params["root"], "Missing --script-param root=/absolute/pack")
local manifestPath = app.params["manifest"] or root .. "/manifest.json"
local outputPath = app.params["output"] or root .. "/naval-ui-assets-v1.aseprite"
assert(string.sub(outputPath, -9) == ".aseprite", "Output path must end with .aseprite")
local file = assert(io.open(manifestPath, "r"), "Cannot open manifest")
local manifest = json.decode(file:read("*a")); file:close()
local assets = assert(manifest.assets, "Manifest has no assets array")
assert(#assets > 0, "Manifest assets array is empty")

local WIDTH, HEIGHT, GUTTER = 1024, 1024, 4
local positions, seen, supplied = {}, {}, 0
for _, asset in ipairs(assets) do
  assert(type(asset.id) == "string" and not seen[asset.id], "Missing or duplicate asset ID")
  seen[asset.id] = true
  if asset.atlas_rect or asset.atlas then supplied = supplied + 1 end
end
assert(supplied == 0 or supplied == #assets, "Either all or no assets must have atlas positions")

local x, y, rowHeight = GUTTER, GUTTER, 0
for i, asset in ipairs(assets) do
  local w, h = assert(tonumber(asset.width)), assert(tonumber(asset.height))
  assert(w > 0 and h > 0 and w % 1 == 0 and h % 1 == 0, "Non-integer dimensions: " .. asset.id)
  if supplied > 0 then
    if asset.atlas_rect then
      local rect = asset.atlas_rect
      x, y = assert(tonumber(rect[1])), assert(tonumber(rect[2]))
      assert(tonumber(rect[3]) == w and tonumber(rect[4]) == h, "atlas_rect size differs: " .. asset.id)
    else
      x, y = assert(tonumber(asset.atlas.x)), assert(tonumber(asset.atlas.y))
    end
  elseif x + w > WIDTH - GUTTER then
    x, y, rowHeight = GUTTER, y + rowHeight + GUTTER, 0
  end
  assert(x % 1 == 0 and y % 1 == 0 and x >= 0 and y >= 0, "Invalid position: " .. asset.id)
  assert(x + w <= WIDTH and y + h <= HEIGHT, "Asset outside 1024x1024 atlas: " .. asset.id)
  for _, prior in ipairs(positions) do
    assert(x >= prior.x + prior.width or x + w <= prior.x or y >= prior.y + prior.height or y + h <= prior.y,
      "Overlapping atlas rectangles: " .. asset.id .. " / " .. prior.id)
  end
  positions[i] = {id=asset.id, x=x, y=y, width=w, height=h}
  if supplied == 0 then x, rowHeight = x + w + GUTTER, math.max(rowHeight, h) end
end

local sprite = Sprite(WIDTH, HEIGHT, ColorMode.RGB)
for i, asset in ipairs(assets) do
  local path = assert(asset.path, "Missing asset path")
  if string.sub(path, 1, 1) ~= "/" then path = root .. "/" .. path end
  local pixels = Image{fromFile=path}
  assert(pixels.width == positions[i].width and pixels.height == positions[i].height,
    "PNG dimensions differ from manifest: " .. asset.id)
  local layer = i == 1 and sprite.layers[1] or sprite:newLayer()
  layer.name = (asset.family or "asset") .. " / " .. asset.id
  layer.data = json.encode({id=asset.id, path=asset.path, status=asset.status, source_job_id=asset.source_job_id})
  sprite:newCel(layer, 1, pixels, Point(positions[i].x, positions[i].y))
end
sprite.data = "Native-pixel asset atlas. One delivered PNG per layer; no image resampling. See manifest for source jobs and status."
sprite:saveAs(outputPath)
local exportPath = string.gsub(outputPath, "%.aseprite$", "-export-check.png")
sprite:saveCopyAs(exportPath)
local indexPath = string.gsub(outputPath, "%.aseprite$", "-atlas-layout.json")
local index = assert(io.open(indexPath, "w")); index:write(json.encode({width=WIDTH, height=HEIGHT, assets=positions})); index:close()
print("Saved native layered atlas: " .. outputPath .. " (" .. #assets .. " layers)")
