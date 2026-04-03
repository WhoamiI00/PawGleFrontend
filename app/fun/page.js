"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import * as fabric from "fabric"
import CirclesBackground from "@/components/background"
import Footer from "@/components/footer"
import { removeBackground } from "@imgly/background-removal"
import {
  Palette,
  Move,
  Hand,
  Square,
  Circle,
  Triangle,
  Star,
  Trash2,
  Download,
  Save,
  RefreshCw,
  ImageIcon,
  Layers,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Type,
} from "lucide-react"

const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT

// Custom filter implementations
const applyGrayscaleFilter = (imageData) => {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + (data[i + 1] + data[i + 2]) / 3)
    
    data[i] = avg // red
    data[i + 1] = avg // green
    data[i + 2] = avg // blue
  }
  return imageData
}

const applySepiaFilter = (imageData) => {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189) // red
    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168) // green
    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131) // blue
  }
  return imageData
}

const applyBrightnessFilter = (imageData, value = 0.2) => {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] + 255 * value)
    data[i + 1] = Math.min(255, data[i + 1] + 255 * value)
    data[i + 2] = Math.min(255, data[i + 2] + 255 * value)
  }
  return imageData
}

const applyContrastFilter = (imageData, value = 0.15) => {
  const data = imageData.data
  const factor = (259 * (value * 100 + 255)) / (255 * (259 - value * 100))

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128))
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128))
  }
  return imageData
}

const applyVintageFilter = (imageData) => {
  // Apply sepia first
  applySepiaFilter(imageData)
  // Then apply contrast
  applyContrastFilter(imageData, 0.15)
  // Finally apply a slight brightness adjustment
  applyBrightnessFilter(imageData, 0.1)
  return imageData
}

export default function PetMediaEditor() {
  const [windowWidth, setWindowWidth] = useState(0)
  const [selectedImage, setSelectedImage] = useState(null) // File object
  const [selectedImagePreview, setSelectedImagePreview] = useState(null) // Data URL
  const [recentEdits, setRecentEdits] = useState([])
  const [loading, setLoading] = useState(false)
  const [processingBg, setProcessingBg] = useState(false)
  const [selectedTool, setSelectedTool] = useState("shapes")
  const [selectedShape, setSelectedShape] = useState("rect")
  const [selectedFilter, setSelectedFilter] = useState(null)
  const [aspectRatio, setAspectRatio] = useState("original")
  const [isPanning, setIsPanning] = useState(false)
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [selectedObject, setSelectedObject] = useState(null)
  const [objectScale, setObjectScale] = useState(1)
  const [objectColor, setObjectColor] = useState("#ff0000")
  const [objectPosition, setObjectPosition] = useState({ x: 0, y: 0 })
  const [canvasLayers, setCanvasLayers] = useState([])
  const [showLayersPanel, setShowLayersPanel] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState("#f0f0f0")
  const [textInput, setTextInput] = useState("")
  const [textColor, setTextColor] = useState("#000000")
  const [textSize, setTextSize] = useState(24)

  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const colorPickerRef = useRef(null)
  const textColorPickerRef = useRef(null)

  // Initialize canvas and set up event listeners
  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)

    // Only initialize once
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: 600,
        height: 600,
        backgroundColor: "#f0f0f0",
        preserveObjectStacking: true,
        selection: true,
      })

      // Add a test rectangle to verify canvas works
      const testRect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: "red",
        opacity: 0.7,
        selectable: true,
        name: "Rectangle 1",
      })
      fabricCanvasRef.current.add(testRect)
      fabricCanvasRef.current.renderAll()

      // Update layers list
      updateLayersList()

      fabricCanvasRef.current.on("selection:created", (e) => {
        const obj = e.selected[0]
        setSelectedObject(obj)
        setObjectScale(obj.scaleX || 1)
        setObjectPosition({ x: Math.round(obj.left), y: Math.round(obj.top) })

        // Update color picker when selecting an object
        if (obj.fill && typeof obj.fill === "string" && obj.fill !== "rgba(0,0,0,0)") {
          setObjectColor(obj.fill)
          if (colorPickerRef.current) {
            colorPickerRef.current.value = obj.fill
          }
        }
      })

      fabricCanvasRef.current.on("selection:updated", (e) => {
        const obj = e.selected[0]
        setSelectedObject(obj)
        setObjectScale(obj.scaleX || 1)
        setObjectPosition({ x: Math.round(obj.left), y: Math.round(obj.top) })

        // Update color picker when selecting a different object
        if (obj.fill && typeof obj.fill === "string" && obj.fill !== "rgba(0,0,0,0)") {
          setObjectColor(obj.fill)
          if (colorPickerRef.current) {
            colorPickerRef.current.value = obj.fill
          }
        }
      })

      fabricCanvasRef.current.on("selection:cleared", () => {
        setSelectedObject(null)
        setObjectScale(1)
        setObjectPosition({ x: 0, y: 0 })
      })

      fabricCanvasRef.current.on("object:scaling", (e) => {
        if (e.target) {
          setObjectScale(e.target.scaleX || 1)
        }
      })

      fabricCanvasRef.current.on("object:moving", (e) => {
        if (e.target) {
          setObjectPosition({
            x: Math.round(e.target.left),
            y: Math.round(e.target.top),
          })
        }
      })

      // Listen for object added/removed to update layers
      fabricCanvasRef.current.on("object:added", updateLayersList)
      fabricCanvasRef.current.on("object:removed", updateLayersList)
      fabricCanvasRef.current.on("object:modified", updateLayersList)

      setIsCanvasReady(true)
    }

    fetchRecentEdits()

    return () => {
      window.removeEventListener("resize", handleResize)
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose()
        } catch (e) {
          console.error("Error disposing canvas:", e)
        }
        fabricCanvasRef.current = null
      }
      setIsCanvasReady(false)
    }
  }, [])

  // Update layers list function
  const updateLayersList = () => {
    if (!fabricCanvasRef.current) return

    const objects = fabricCanvasRef.current.getObjects()
    const layers = objects
      .map((obj, index) => {
        // Generate a name based on object type if not already set
        if (!obj.name) {
          obj.name = `${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)} ${index + 1}`
        }

        return {
          id: obj.id || index,
          name: obj.name,
          type: obj.type,
          object: obj,
          thumbnail: obj.toDataURL ? obj.toDataURL({ format: "png", multiplier: 0.1 }) : null,
        }
      })
      .reverse() // Reverse to show top layers first

    setCanvasLayers(layers)
  }

  // Improved pan tool implementation
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !isCanvasReady) return

    // Set selection mode based on panning state
    canvas.selection = !isPanning

    // Update all objects' selectable property
    canvas.forEachObject((obj) => {
      obj.selectable = !isPanning
      obj.evented = !isPanning
    })

    let isDragging = false
    let lastPosX = 0
    let lastPosY = 0

    const handleMouseDown = (opt) => {
      if (isPanning) {
        isDragging = true
        lastPosX = opt.e.clientX
        lastPosY = opt.e.clientY
        canvas.defaultCursor = "grabbing"
        canvas.renderAll()
        opt.e.preventDefault()
        return false
      }
    }

    const handleMouseMove = (opt) => {
      if (isDragging && isPanning) {
        const deltaX = opt.e.clientX - lastPosX
        const deltaY = opt.e.clientY - lastPosY

        // Use relativePan for smoother panning
        canvas.relativePan(new fabric.Point(deltaX, deltaY))

        lastPosX = opt.e.clientX
        lastPosY = opt.e.clientY
        canvas.requestRenderAll()
        opt.e.preventDefault()
      }
    }

    const handleMouseUp = () => {
      if (isPanning) {
        isDragging = false
        canvas.defaultCursor = "grab"
        canvas.renderAll()
      }
    }

    // Prevent context menu when panning with right-click
    const preventContextMenu = (e) => {
      if (isPanning) {
        e.preventDefault()
        return false
      }
    }

    canvas.on("mouse:down", handleMouseDown)
    canvas.on("mouse:move", handleMouseMove)
    canvas.on("mouse:up", handleMouseUp)
    canvas.defaultCursor = isPanning ? "grab" : "default"

    if (canvas.wrapperEl) {
      canvas.wrapperEl.addEventListener("contextmenu", preventContextMenu)
    }

    return () => {
      if (canvas) {
        canvas.off("mouse:down", handleMouseDown)
        canvas.off("mouse:move", handleMouseMove)
        canvas.off("mouse:up", handleMouseUp)
        if (canvas.wrapperEl) {
          canvas.wrapperEl.removeEventListener("contextmenu", preventContextMenu)
        }
      }
    }
  }, [isPanning, isCanvasReady])

  // Fetch recent edits
  const fetchRecentEdits = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`${BACKEND_API_PORT}/api/auth/edited-pet-images/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        return
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        setRecentEdits(data)
      } else {
        const text = await response.text()
        console.error("Expected JSON but got:", text)
      }
    } catch (error) {
      console.error("Error fetching recent edits:", error)
    }
  }

  // Add this function after the fetchRecentEdits function
  // Load a saved edit
  const loadSavedEdit = async (edit) => {
    if (!fabricCanvasRef.current) return
    setLoading(true)

    try {
      const canvas = fabricCanvasRef.current

      // Clear the current canvas
      canvas.clear()

      // Set background color if available
      if (edit.edit_metadata && edit.edit_metadata.objects && edit.edit_metadata.objects.background) {
        canvas.backgroundColor = edit.edit_metadata.objects.background
        setBackgroundColor(edit.edit_metadata.objects.background)
      } else {
        canvas.backgroundColor = "#f0f0f0" // Default background
        setBackgroundColor("#f0f0f0")
      }

      // Load the image
      if (edit.edited_image_url) {
        // Create a native browser Image element
        const imgElement = new window.Image()
        imgElement.crossOrigin = "anonymous" // Add this to avoid CORS issues

        // Wait for the image to load
        await new Promise((resolve, reject) => {
          imgElement.onload = resolve
          imgElement.onerror = reject
          imgElement.src = edit.edited_image_url
        })

        // Create fabric image from loaded element
        const fabricImage = new fabric.Image(imgElement)
        fabricImage.name = "Loaded Image"

        // Calculate scale to fit canvas
        const scale = Math.min((canvas.width * 0.8) / imgElement.width, (canvas.height * 0.8) / imgElement.height)

        // Position in center with proper scaling
        fabricImage.set({
          scaleX: scale,
          scaleY: scale,
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: "center",
          originY: "center",
          selectable: true,
          hasControls: true,
        })

        // Add the image to canvas
        canvas.add(fabricImage)
        canvas.setActiveObject(fabricImage)
        setSelectedObject(fabricImage)
        setObjectScale(scale)
        setObjectPosition({
          x: Math.round(fabricImage.left),
          y: Math.round(fabricImage.top),
        })
      }

      // Try to load objects if available in the metadata
      // Note: This is a simplified approach - full object restoration would require more complex handling
      if (edit.edit_metadata && edit.edit_metadata.objects && edit.edit_metadata.objects.objects) {
        // For now, we're just loading the image as the full object restoration is complex
        // Object data available but using simplified loading
      }

      // Apply filter if available
      if (edit.edit_metadata && edit.edit_metadata.filters) {
        setSelectedFilter(edit.edit_metadata.filters)
        applyFilter(edit.edit_metadata.filters)
      }

      canvas.renderAll()
      updateLayersList()

      setLoading(false)
    } catch (error) {
    //   console.error("Error loading saved edit:", error)
    //   setLoading(false)
    //   alert("Failed to load the edit. Please try again.")
    }
  }

  // Handle image upload: just preview, not import to canvas
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setSelectedImagePreview(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  // Import previewed image to canvas - FIXED VERSION
  const importImageToCanvas = () => {
    if (!selectedImagePreview || !isCanvasReady || !fabricCanvasRef.current) {
      console.error("Missing prerequisites for import:", {
        hasImagePreview: !!selectedImagePreview,
        isCanvasReady,
        hasCanvas: !!fabricCanvasRef.current,
      })
      return
    }

    const canvas = fabricCanvasRef.current

    // Create a native browser Image element (not Next.js Image)
    const imgElement = new window.Image()
    imgElement.crossOrigin = "anonymous" // Add this to avoid CORS issues

    imgElement.onload = () => {

      // Create fabric image from loaded element
      const fabricImage = new fabric.Image(imgElement)
      fabricImage.name = "Image " + new Date().toLocaleTimeString()

      // Calculate scale for 1/4 of canvas size
      const targetSize = canvas.width / 2
      const scale = Math.min(targetSize / imgElement.width, targetSize / imgElement.height)

      // Position in center with proper scaling
      fabricImage.set({
        scaleX: scale,
        scaleY: scale,
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: "center",
        originY: "center",
        selectable: true,
        hasControls: true,
      })

      // Add and select the image without clearing the canvas
      canvas.add(fabricImage)
      canvas.setActiveObject(fabricImage)
      canvas.renderAll()

      // Update state
      setSelectedObject(fabricImage)
      setObjectScale(scale)
      setObjectPosition({
        x: Math.round(fabricImage.left),
        y: Math.round(fabricImage.top),
      })
      updateLayersList()

      // Clear the selected image preview so user can add another image
      setSelectedImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }

    imgElement.onerror = (err) => {
      console.error("Error loading image:", err)
    }

    imgElement.src = selectedImagePreview
  }

  // Add text to canvas
  const addTextToCanvas = () => {
    if (!fabricCanvasRef.current || !textInput.trim()) return

    const canvas = fabricCanvasRef.current
    const text = new fabric.Text(textInput, {
      left: 100,
      top: 100,
      fontFamily: "Arial",
      fontSize: textSize,
      fill: textColor,
      name: `Text ${canvasLayers.length + 1}`,
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    setSelectedObject(text)
    setObjectPosition({ x: Math.round(text.left), y: Math.round(text.top) })
    updateLayersList()

    // Clear the text input
    setTextInput("")
  }

  // Selection tool - deselects all objects
  const selectionTool = () => {
    if (!fabricCanvasRef.current) return

    // Deselect active objects
    fabricCanvasRef.current.discardActiveObject()

    // Reset cursor to default
    fabricCanvasRef.current.defaultCursor = "default"

    // Enable selection and make all objects selectable
    fabricCanvasRef.current.selection = true
    fabricCanvasRef.current.forEachObject((obj) => {
      obj.selectable = true
      obj.evented = true
    })

    fabricCanvasRef.current.requestRenderAll()
    setIsPanning(false)
    setSelectedObject(null)
  }

  // Add shape to canvas
  const addShape = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    let shape
    const shapeName = selectedShape.charAt(0).toUpperCase() + selectedShape.slice(1)

    switch (selectedShape) {
      case "rect":
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: objectColor,
          name: `Rectangle ${canvasLayers.length + 1}`,
        })
        break
      case "circle":
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: objectColor,
          name: `Circle ${canvasLayers.length + 1}`,
        })
        break
      case "triangle":
        shape = new fabric.Triangle({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: objectColor,
          name: `Triangle ${canvasLayers.length + 1}`,
        })
        break
      case "star":
        const points = []
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? 50 : 25
          const angle = (Math.PI / 5) * i
          points.push({
            x: radius * Math.sin(angle),
            y: radius * Math.cos(angle),
          })
        }
        shape = new fabric.Polygon(points, {
          left: 100,
          top: 100,
          fill: objectColor,
          name: `Star ${canvasLayers.length + 1}`,
        })
        break
      default:
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: objectColor,
          name: `Rectangle ${canvasLayers.length + 1}`,
        })
    }

    shape.set({
      selectable: true,
      hasControls: true,
      hasBorders: true,
    })

    canvas.add(shape)
    canvas.setActiveObject(shape)
    shape.setCoords()
    setSelectedObject(shape)
    setObjectScale(shape.scaleX || 1)
    setObjectPosition({ x: Math.round(shape.left), y: Math.round(shape.top) })
    canvas.requestRenderAll()
    updateLayersList()
  }

  // Add overlay to canvas
  const addOverlay = (overlayType) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    let overlay
    switch (overlayType) {
      case "paw":
        const pawPath =
          "M25,25 C33,20 38,25 40,40 C42,55 38,60 30,65 C22,60 18,55 20,40 C22,25 27,20 35,25 M45,5 C53,0 58,5 60,20 C62,35 58,40 50,45 C42,40 38,35 40,20 C42,5 47,0 55,5 M65,5 C73,0 78,5 80,20 C82,35 78,40 70,45 C62,40 58,35 60,20 C62,5 67,0 75,5 M85,25 C93,20 98,25 100,40 C102,55 98,60 90,65 C82,60 78,55 80,40 C82,25 87,20 95,25 M60,75 C70,60 80,60 90,75 C100,90 90,105 60,105 C30,105 20,90 30,75 C40,60 50,60 60,75"
        overlay = new fabric.Path(pawPath, {
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
          fill: objectColor,
          name: `Paw ${canvasLayers.length + 1}`,
        })
        break
      case "hat":
        const hatPath = "M10,50 L90,50 L80,10 C65,0 35,0 20,10 Z"
        overlay = new fabric.Path(hatPath, {
          left: 100,
          top: 100,
          fill: objectColor,
          name: `Hat ${canvasLayers.length + 1}`,
        })
        break
      case "collar":
        overlay = new fabric.Rect({
          left: 100,
          top: 100,
          width: 200,
          height: 40,
          rx: 20,
          ry: 20,
          fill: objectColor,
          name: `Collar ${canvasLayers.length + 1}`,
        })

        // Add a tag
        const tag = new fabric.Circle({
          left: 190,
          top: 120,
          radius: 15,
          fill: "rgba(255, 215, 0, 0.9)",
          selectable: true,
          hasControls: true,
          name: `Tag ${canvasLayers.length + 2}`,
        })
        canvas.add(tag)
        tag.setCoords()
        break
      default:
        overlay = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: objectColor,
          name: `Shape ${canvasLayers.length + 1}`,
        })
    }

    overlay.set({
      selectable: true,
      hasControls: true,
      hasBorders: true,
    })

    canvas.add(overlay)
    canvas.setActiveObject(overlay)
    overlay.setCoords()
    setSelectedObject(overlay)
    setObjectScale(overlay.scaleX || 1)
    setObjectPosition({ x: Math.round(overlay.left), y: Math.round(overlay.top) })
    canvas.requestRenderAll()
    updateLayersList()
  }

  // Apply filter using custom implementation
  const applyFilter = (filterType) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    setSelectedFilter(filterType)

    // Get the active object if it's an image, or find the first image
    let imageObj = null

    if (selectedObject && selectedObject.type === "image") {
      imageObj = selectedObject
    } else {
      // If no image is selected, find the first image
      const objects = canvas.getObjects()
      imageObj = objects.find((obj) => obj.type === "image")
    }

    if (!imageObj) {
      alert("Please select an image or add an image first")
      return
    }

    // Get the original image element
    const imgElement = imageObj._element
    if (!imgElement) {
      console.error("Image element not found")
      return
    }

    // Create a temporary canvas to apply the filter
    const tempCanvas = document.createElement("canvas")
    const ctx = tempCanvas.getContext("2d")
    tempCanvas.width = imgElement.width
    tempCanvas.height = imgElement.height

    // Draw the original image to the temporary canvas
    ctx.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height)

    // Get the image data
    let imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)

    // Apply the selected filter
    switch (filterType) {
      case "grayscale":
        imageData = applyGrayscaleFilter(imageData)
        break
      case "sepia":
        imageData = applySepiaFilter(imageData)
        break
      case "vintage":
        imageData = applyVintageFilter(imageData)
        break
      case "bright":
        imageData = applyBrightnessFilter(imageData)
        applyContrastFilter(imageData)
        break
      default:
        // If no filter or "normal", just use the original image
        canvas.requestRenderAll()
        return
    }

    // Put the filtered image data back to the canvas
    ctx.putImageData(imageData, 0, 0)

    // Create a new image from the filtered canvas
    const filteredImgElement = new Image()
    filteredImgElement.crossOrigin = "anonymous"

    filteredImgElement.onload = () => {
      // Create a new fabric image with the filtered image
      const filteredFabricImage = new fabric.Image(filteredImgElement)

      // Copy properties from the original image
      filteredFabricImage.set({
        left: imageObj.left,
        top: imageObj.top,
        scaleX: imageObj.scaleX,
        scaleY: imageObj.scaleY,
        angle: imageObj.angle,
        flipX: imageObj.flipX,
        flipY: imageObj.flipY,
        originX: imageObj.originX,
        originY: imageObj.originY,
        selectable: true,
        hasControls: true,
        name: imageObj.name + " (Filtered)",
      })

      // Replace the original image with the filtered one
      canvas.remove(imageObj)
      canvas.add(filteredFabricImage)
      canvas.setActiveObject(filteredFabricImage)
      canvas.renderAll()

      // Update state
      setSelectedObject(filteredFabricImage)
      setObjectScale(filteredFabricImage.scaleX || 1)
      setObjectPosition({
        x: Math.round(filteredFabricImage.left),
        y: Math.round(filteredFabricImage.top),
      })
      updateLayersList()
    }

    // Convert the canvas to a data URL and set it as the source for the new image
    filteredImgElement.src = tempCanvas.toDataURL("image/png")
  }

  // Change aspect ratio
  const changeAspectRatio = (ratio) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    setAspectRatio(ratio)

    canvas.viewportTransform = [1, 0, 0, 1, 0, 0]

    let newWidth = 600,
      newHeight = 600
    switch (ratio) {
      case "1:1":
        newWidth = 600
        newHeight = 600
        break
      case "4:5":
        newWidth = 480
        newHeight = 600
        break
      case "16:9":
        newWidth = 600
        newHeight = 338
        break
      default:
        return
    }

    canvas.setDimensions({ width: newWidth, height: newHeight })

    const objects = canvas.getObjects()
    if (objects.length > 0) {
      canvas.centerObject(objects[0])
      objects[0].setCoords()
    }

    canvas.forEachObject((obj) => {
      obj.setCoords()
    })

    canvas.requestRenderAll()
  }

  // Remove background
  const removeImageBackground = async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // Get the active object if it's an image, or find the first image
    let imageObj = null

    if (selectedObject && selectedObject.type === "image") {
      imageObj = selectedObject
    } else {
      // If no image is selected, find the first image
      const objects = canvas.getObjects()
      imageObj = objects.find((obj) => obj.type === "image")
    }

    if (!imageObj) {
      alert("Please select an image or add an image first")
      return
    }

    setProcessingBg(true)

    try {
      const dataUrl = imageObj.toDataURL()
      const blob = await fetch(dataUrl).then((r) => r.blob())

      const processedImageBlob = await removeBackground(blob, {
      })

      const processedDataUrl = URL.createObjectURL(processedImageBlob)

      // Use a native browser image element
      const imgElement = new window.Image()
      imgElement.crossOrigin = "anonymous" // Add this to avoid CORS issues

      imgElement.onload = () => {
        const originalLeft = imageObj.left
        const originalTop = imageObj.top
        const originalScaleX = imageObj.scaleX
        const originalScaleY = imageObj.scaleY
        const originalName = imageObj.name || "Image (No BG)"

        canvas.remove(imageObj)

        const newImage = new fabric.Image(imgElement)
        newImage.set({
          left: originalLeft,
          top: originalTop,
          scaleX: originalScaleX,
          scaleY: originalScaleY,
          selectable: true,
          hasControls: true,
          name: originalName + " (No BG)",
        })

        canvas.add(newImage)
        canvas.setActiveObject(newImage)
        newImage.setCoords()
        setSelectedObject(newImage)
        setObjectScale(newImage.scaleX || 1)
        setObjectPosition({ x: Math.round(newImage.left), y: Math.round(newImage.top) })
        canvas.requestRenderAll()
        updateLayersList()
        setProcessingBg(false)
      }

      imgElement.src = processedDataUrl
    } catch (error) {
      console.error("Error removing background:", error)
      setProcessingBg(false)
      alert("Failed to remove background. Please try again.")
    }
  }

  // Download image
  const downloadImage = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const originalTransform = [...canvas.viewportTransform]

    canvas.viewportTransform = [1, 0, 0, 1, 0, 0]
    canvas.forEachObject((obj) => {
      obj.setCoords()
    })

    canvas.renderAll()

    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    })

    canvas.viewportTransform = originalTransform
    canvas.requestRenderAll()

    const link = document.createElement("a")
    link.download = "pet-edited-image.png"
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Save edited image to backend
  const saveEditedImage = async () => {
    if (!fabricCanvasRef.current) return
    setLoading(true)

    try {
      const canvas = fabricCanvasRef.current
      const dataUrl = canvas.toDataURL({ format: "png", quality: 1 })
      const blob = await fetch(dataUrl).then((r) => r.blob())
      const editedFile = new File([blob], "edited-pet-image.png", { type: "image/png" })

      const formData = new FormData()
      formData.append("edited_image", editedFile)
      formData.append("edit_metadata", JSON.stringify({ filters: selectedFilter, objects: canvas.toJSON() }))

      const token = localStorage.getItem("accessToken")
      const response = await fetch(`${BACKEND_API_PORT}/api/auth/edited-pet-images/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to save edited image")
      }

      // Refresh recent edits after successful save
      await fetchRecentEdits()
      setLoading(false)
      alert("Image saved successfully!")
    } catch (error) {
      console.error("Error saving image:", error)
      setLoading(false)
      alert("Failed to save image. Please try again.")
    }
  }

  // Clear canvas
  const clearCanvas = () => {
    if (window.confirm("Are you sure you want to clear the canvas?")) {
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      canvas.clear()
      canvas.backgroundColor = backgroundColor
      canvas.requestRenderAll()

      setSelectedImage(null)
      setSelectedImagePreview(null)
      setSelectedFilter(null)
      setSelectedObject(null)
      setObjectScale(1)
      setObjectPosition({ x: 0, y: 0 })
      updateLayersList()
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Delete selected object
  const deleteActiveObject = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.remove(activeObject)
      canvas.requestRenderAll()
      if (activeObject.type === "image") {
        setSelectedImage(null)
      }
      setSelectedObject(null)
      updateLayersList()
    }
  }

  // Reset view
  const resetView = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    canvas.viewportTransform = [1, 0, 0, 1, 0, 0]
    canvas.forEachObject((obj) => {
      obj.setCoords()
    })

    canvas.requestRenderAll()
  }

  // Handle scale change
  const handleScaleChange = (e) => {
    const scale = Number.parseFloat(e.target.value)
    if (!selectedObject || !fabricCanvasRef.current) return

    setObjectScale(scale)
    selectedObject.scale(scale)
    fabricCanvasRef.current.requestRenderAll()
  }

  // Handle color change
  const handleColorChange = (e) => {
    const color = e.target.value
    setObjectColor(color)

    if (selectedObject && fabricCanvasRef.current) {
      // Check if the object has a fill property
      if (selectedObject.fill !== undefined) {
        selectedObject.set("fill", color)
        fabricCanvasRef.current.requestRenderAll()
        updateLayersList()
      }
    }
  }

  // Handle text color change
  const handleTextColorChange = (e) => {
    const color = e.target.value
    setTextColor(color)
  }

  // Handle background color change
  const handleBackgroundColorChange = (e) => {
    const color = e.target.value
    setBackgroundColor(color)

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.backgroundColor = color
      fabricCanvasRef.current.requestRenderAll()
    }
  }

  // Handle position change for X coordinate
  const handlePositionXChange = (e) => {
    if (!selectedObject || !fabricCanvasRef.current) return

    const x = Number.parseInt(e.target.value, 10)
    if (isNaN(x)) return

    setObjectPosition((prev) => ({ ...prev, x }))
    selectedObject.set({ left: x })
    selectedObject.setCoords()
    fabricCanvasRef.current.requestRenderAll()
  }

  // Handle position change for Y coordinate
  const handlePositionYChange = (e) => {
    if (!selectedObject || !fabricCanvasRef.current) return

    const y = Number.parseInt(e.target.value, 10)
    if (isNaN(y)) return

    setObjectPosition((prev) => ({ ...prev, y }))
    selectedObject.set({ top: y })
    selectedObject.setCoords()
    fabricCanvasRef.current.requestRenderAll()
  }

  // Select layer from layers panel
  const selectLayer = (layerObject) => {
    if (!fabricCanvasRef.current) return

    fabricCanvasRef.current.setActiveObject(layerObject)
    fabricCanvasRef.current.requestRenderAll()
  }

  // Move layer up in stacking order
  const moveLayerUp = (layerObject) => {
    if (!fabricCanvasRef.current) return

    fabricCanvasRef.current.bringForward(layerObject)
    fabricCanvasRef.current.requestRenderAll()
    updateLayersList()
  }

  // Move layer down in stacking order
  const moveLayerDown = (layerObject) => {
    if (!fabricCanvasRef.current) return

    fabricCanvasRef.current.sendBackwards(layerObject)
    fabricCanvasRef.current.requestRenderAll()
    updateLayersList()
  }

  // Bring layer to front
  const bringLayerToFront = (layerObject) => {
    if (!fabricCanvasRef.current) return

    fabricCanvasRef.current.bringToFront(layerObject)
    fabricCanvasRef.current.requestRenderAll()
    updateLayersList()
  }

  // Send layer to back
  const sendLayerToBack = (layerObject) => {
    if (!fabricCanvasRef.current) return

    fabricCanvasRef.current.sendToBack(layerObject)
    fabricCanvasRef.current.requestRenderAll()
    updateLayersList()
  }

  // Rename layer
  const renameLayer = (layerObject, newName) => {
    if (!layerObject) return

    layerObject.name = newName
    updateLayersList()
  }

  // Loading overlay
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg z-20">
      <div className="text-white text-xl animate-pulse">Initializing Canvas...</div>
    </div>
  )

  return (
    <>
      <CirclesBackground height={windowWidth} />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--background2)] to-[var(--backgroundColor)] text-white">
        <main className="flex flex-col md:flex-row p-6 space-x-0 md:space-x-6 mt-20">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 p-4 rounded-lg shadow-lg mb-6 md:mb-0 h-[84vh] overflow-y-auto scroll-smooth text-[var(--textColor)] bg-[var(--backgroundColor)] z-10">
            <h2 className="text-xl font-semibold mb-4">Edit Tools</h2>
            <div className="mb-6">
              <h3 className="font-medium mb-2">Upload Image</h3>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="w-full p-2 rounded bg-[var(--background2)] text-[var(--textColor)]"
              />
              {selectedImagePreview && (
                <div className="mt-3">
                  <Image
                    src={selectedImagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-auto mb-2 rounded"
                    style={{ maxHeight: 180, objectFit: "contain" }}
                    height={100}
                    width={100}
                  />
                  <button
                    onClick={importImageToCanvas}
                    className="w-full py-2 px-4 rounded-lg bg-[var(--primaryColor)] text-[var(--textColor3)] hover:bg-[var(--primary1)] transition duration-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ImageIcon size={16} />
                      Import to Canvas
                    </div>
                  </button>
                </div>
              )}
            </div>

            {selectedObject && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Object Properties</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Size</label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={objectScale}
                      onChange={handleScaleChange}
                      className="w-full accent-[var(--primaryColor)]"
                    />
                    <div className="text-center mt-1">{Math.round(objectScale * 100)}%</div>
                  </div>

                  {/* Position X control */}
                  <div>
                    <label className="block text-sm mb-1">Position X</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="600"
                        value={objectPosition.x}
                        onChange={handlePositionXChange}
                        className="w-full accent-[var(--primaryColor)]"
                      />
                      <input
                        type="number"
                        value={objectPosition.x}
                        onChange={handlePositionXChange}
                        className="w-16 p-1 text-sm rounded bg-[var(--background2)]"
                      />
                    </div>
                  </div>

                  {/* Position Y control */}
                  <div>
                    <label className="block text-sm mb-1">Position Y</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="600"
                        value={objectPosition.y}
                        onChange={handlePositionYChange}
                        className="w-full accent-[var(--primaryColor)]"
                      />
                      <input
                        type="number"
                        value={objectPosition.y}
                        onChange={handlePositionYChange}
                        className="w-16 p-1 text-sm rounded bg-[var(--background2)]"
                      />
                    </div>
                  </div>

                  {/* Color picker for non-image objects */}
                  {selectedObject && selectedObject.type !== "image" && (
                    <div>
                      <label className="block text-sm mb-1">Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={colorPickerRef}
                          type="color"
                          value={objectColor}
                          onChange={handleColorChange}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <span className="text-sm">{objectColor}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-medium mb-2">Tools</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={selectionTool}
                  className="py-2 px-4 rounded-lg bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)] transition duration-200 flex items-center gap-1"
                >
                  <Move size={16} />
                  Selection
                </button>
                {/* <button
                  onClick={() => setIsPanning((prev) => !prev)}
                  className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${isPanning ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  <Hand size={16} />
                  {isPanning ? "Hand Tool (On)" : "Hand Tool"}
                </button> */}
                <button
                  onClick={() => setSelectedTool("shapes")}
                  className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${selectedTool === "shapes" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  <Square size={16} />
                  Shapes
                </button>
                <button
                  onClick={() => setSelectedTool("text")}
                  className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${selectedTool === "text" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  <Type size={16} />
                  Text
                </button>
                <button
                  onClick={() => setSelectedTool("overlays")}
                  className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${selectedTool === "overlays" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  <Palette size={16} />
                  Overlays
                </button>
                {/* <button
                  onClick={() => setSelectedTool("filters")}
                  className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${selectedTool === "filters" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  <ImageIcon size={16} />
                  Filters
                </button> */}
                <button
                  onClick={() => setShowLayersPanel(!showLayersPanel)}
                  className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${showLayersPanel ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  <Layers size={16} />
                  Layers
                </button>
              </div>
            </div>
            {selectedTool === "shapes" && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Shapes</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedShape("rect")}
                    className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${selectedShape === "rect" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                  >
                    <Square size={16} />
                    Rectangle
                  </button>
                  <button
                    onClick={() => setSelectedShape("circle")}
                    className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${selectedShape === "circle" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                  >
                    <Circle size={16} />
                    Circle
                  </button>
                  <button
                    onClick={() => setSelectedShape("triangle")}
                    className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${selectedShape === "triangle" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                  >
                    <Triangle size={16} />
                    Triangle
                  </button>
                  <button
                    onClick={() => setSelectedShape("star")}
                    className={`py-2 px-4 rounded-lg transition duration-200 flex items-center gap-1 ${selectedShape === "star" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                  >
                    <Star size={16} />
                    Star
                  </button>
                </div>
                <div className="mt-3">
                  <label className="block text-sm mb-1">Shape Color</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={objectColor}
                      onChange={handleColorChange}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-sm">{objectColor}</span>
                  </div>
                  <button
                    onClick={addShape}
                    className="w-full py-2 px-4 rounded-lg bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primaryColor)] transition duration-200 flex items-center justify-center gap-1"
                  >
                    <Square size={16} />
                    Add Shape
                  </button>
                </div>
              </div>
            )}
            {selectedTool === "text" && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Text Tool</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Text Content</label>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text here"
                      className="w-full p-2 rounded bg-[var(--background2)] text-[var(--textColor)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={textColorPickerRef}
                        type="color"
                        value={textColor}
                        onChange={handleTextColorChange}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <span className="text-sm">{textColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Text Size</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="10"
                        max="72"
                        value={textSize}
                        onChange={(e) => setTextSize(Number(e.target.value))}
                        className="w-full accent-[var(--primaryColor)]"
                      />
                      <span className="text-sm">{textSize}px</span>
                    </div>
                  </div>
                  <button
                    onClick={addTextToCanvas}
                    disabled={!textInput.trim()}
                    className={`w-full py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-1 ${!textInput.trim() ? "bg-gray-500 text-gray-300 cursor-not-allowed" : "bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primaryColor)]"}`}
                  >
                    <Type size={16} />
                    Add Text
                  </button>
                </div>
              </div>
            )}
            {selectedTool === "overlays" && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Pet Overlays</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => addOverlay("paw")}
                    className="py-2 px-4 rounded-lg bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)] transition duration-200"
                  >
                    Paw Print
                  </button>
                  <button
                    onClick={() => addOverlay("hat")}
                    className="py-2 px-4 rounded-lg bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)] transition duration-200"
                  >
                    Pet Hat
                  </button>
                  <button
                    onClick={() => addOverlay("collar")}
                    className="py-2 px-4 rounded-lg bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)] transition duration-200"
                  >
                    Collar
                  </button>
                </div>
                <div className="mt-3">
                  <label className="block text-sm mb-1">Overlay Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={objectColor}
                      onChange={handleColorChange}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-sm">{objectColor}</span>
                  </div>
                </div>
              </div>
            )}
            {selectedTool === "filters" && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Filters</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyFilter(null)}
                    className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === null ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => applyFilter("grayscale")}
                    className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === "grayscale" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                  >
                    Grayscale
                  </button>
                  <button
                    onClick={() => applyFilter("sepia")}
                    className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === "sepia" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => applyFilter("vintage")}
                    className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === "vintage" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                  >
                    Vintage
                  </button>
                  <button
                    onClick={() => applyFilter("bright")}
                    className={`py-2 px-4 rounded-lg transition duration-200 ${selectedFilter === "bright" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover  text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                  >
                    Bright
                  </button>
                </div>
              </div>
            )}
            {showLayersPanel && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Layers</h3>
                <div className="bg-[var(--background2)] rounded-lg p-2 max-h-60 overflow-y-auto">
                  {canvasLayers.length === 0 ? (
                    <p className="text-sm text-center py-2">No layers available</p>
                  ) : (
                    <ul className="space-y-2">
                      {canvasLayers.map((layer, index) => (
                        <li
                          key={index}
                          className={`p-2 rounded-md flex items-center justify-between ${selectedObject === layer.object ? "bg-[var(--primaryColor)] bg-opacity-30" : "hover:bg-[var(--background)] hover:bg-opacity-30"}`}
                        >
                          <div
                            className="flex items-center gap-2 cursor-pointer flex-1"
                            onClick={() => selectLayer(layer.object)}
                          >
                            {layer.thumbnail ? (
                              <div className="w-8 h-8 bg-white rounded overflow-hidden flex items-center justify-center">
                                <Image
                                  src={layer.thumbnail || "/placeholder.svg"}
                                  alt={layer.name}
                                  className="max-w-full max-h-full"
                                  height={100}
                                  width={100}
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-white rounded overflow-hidden flex items-center justify-center">
                                {layer.type === "rect" && <Square size={16} />}
                                {layer.type === "circle" && <Circle size={16} />}
                                {layer.type === "triangle" && <Triangle size={16} />}
                                {layer.type === "polygon" && <Star size={16} />}
                                {layer.type === "path" && <Palette size={16} />}
                                {layer.type === "text" && <Type size={16} />}
                              </div>
                            )}
                            <span className="text-sm truncate max-w-[120px]">{layer.name}</span>
                          </div>
                          {/* <div className="flex gap-1">
                            <button
                              onClick={() => moveLayerUp(layer.object)}
                              className="p-1 rounded hover:bg-[var(--primaryColor)] hover:bg-opacity-30"
                              title="Move Up"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => moveLayerDown(layer.object)}
                              className="p-1 rounded hover:bg-[var(--primaryColor)] hover:bg-opacity-30"
                              title="Move Down"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div> */}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* <div className="flex justify-between mt-2">
                  <button
                    onClick={() => selectedObject && bringLayerToFront(selectedObject)}
                    disabled={!selectedObject}
                    className={`py-1 px-2 rounded-lg text-xs flex items-center gap-1 ${!selectedObject ? "bg-gray-500 text-gray-300 cursor-not-allowed" : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]"}`}
                  >
                    <ArrowUp size={12} />
                    Bring to Front
                  </button>
                  <button
                    onClick={() => selectedObject && sendLayerToBack(selectedObject)}
                    disabled={!selectedObject}
                    className={`py-1 px-2 rounded-lg text-xs flex items-center gap-1 ${!selectedObject ? "bg-gray-500 text-gray-300 cursor-not-allowed" : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]"}`}
                  >
                    <ArrowDown size={12} />
                    Send to Back
                  </button>
                </div> */}
              </div>
            )}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Aspect Ratio</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => changeAspectRatio("original")}
                  className={`py-2 px-4 rounded-lg transition duration-200 ${aspectRatio === "original" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  Original
                </button>
                <button
                  onClick={() => changeAspectRatio("1:1")}
                  className={`py-2 px-4 rounded-lg transition duration-200 ${aspectRatio === "1:1" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  1:1
                </button>
                <button
                  onClick={() => changeAspectRatio("4:5")}
                  className={`py-2 px-4 rounded-lg transition duration-200 ${aspectRatio === "4:5" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  4:5
                </button>
                <button
                  onClick={() => changeAspectRatio("16:9")}
                  className={`py-2 px-4 rounded-lg transition duration-200 ${aspectRatio === "16:9" ? "bg-[var(--primaryColor)] text-[var(--textColor3)]" : "bg-[var(--background2)] text-[var(--textColor)]"} hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)]`}
                >
                  16:9
                </button>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-medium mb-2">Canvas Background</h3>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={handleBackgroundColorChange}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <span className="text-sm">{backgroundColor}</span>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-medium mb-2">Advanced Tools</h3>
              <button
                onClick={resetView}
                className="w-full py-2 px-4 rounded-lg bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primaryColor)] hover:text-[var(--textColor3)] transition duration-200 mb-2 flex items-center justify-center gap-1"
              >
                <RefreshCw size={16} />
                Reset View
              </button>
              <button
                onClick={removeImageBackground}
                disabled={processingBg}
                className={`w-full py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-1 ${processingBg ? "bg-gray-500 text-gray-300 cursor-not-allowed" : "bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primaryColor)]"}`}
              >
                {processingBg ? "Processing..." : "Remove Background"}
              </button>
              <button
                onClick={deleteActiveObject}
                className="w-full mt-2 py-2 px-4 rounded-lg bg-[var(--c2)] text-[var(--textColor3)] hover:bg-[var(--c4)] transition duration-200 flex items-center justify-center gap-1"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
              <button
                onClick={saveEditedImage}
                disabled={loading}
                className="w-full mt-2 py-2 px-4 rounded-lg bg-[var(--primaryColor)] text-[var(--textColor3)] hover:bg-[var(--primary1)] transition duration-200 flex items-center justify-center gap-1"
              >
                <Save size={16} />
                {loading ? "Saving..." : "Save Edit"}
              </button>
            </div>
          </div>
          {/* Main Canvas Area */}
          <div className="w-full md:w-3/4 p-6 rounded-lg shadow-lg relative h-[84vh] overflow-y-auto scroll-smooth text-[var(--textColor)] bg-[var(--backgroundColor)]">
            {!isCanvasReady && <LoadingOverlay />}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Pet Media Editor</h1>
              <div className="flex gap-2">
                <button
                  onClick={downloadImage}
                  className="py-2 px-4 rounded-lg bg-[var(--primaryColor)] hover:bg-[var(--primary1)] text-[var(--textColor3)] transition flex items-center gap-1"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={clearCanvas}
                  className="py-2 px-4 rounded-lg bg-[var(--c2)] hover:bg-[var(--c4)] text-[var(--textColor3)] transition flex items-center gap-1"
                >
                  <Trash2 size={16} />
                  Clear
                </button>
              </div>
            </div>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width="600"
                height="600"
                className="border-2 border-dashed border-[var(--primaryColor)] rounded-lg bg-[var(--background2)] mx-auto"
                style={{ display: isCanvasReady ? "block" : "none" }}
              />
            </div>
            {recentEdits.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Recent Edits</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recentEdits.map((edit) => (
                    <div key={edit.id} className="relative group rounded-lg overflow-hidden">
                      <Image
                        src={edit.edited_image_url || "/placeholder.svg"}
                        alt="Recent edit"
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => loadSavedEdit(edit)}
                            className="bg-[var(--primaryColor)] text-white py-1 px-3 rounded-lg text-sm"
                          >
                            Load
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
