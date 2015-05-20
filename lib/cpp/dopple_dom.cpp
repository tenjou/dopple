#include "dopple_dom.h"

#define STBI_NO_PSD
#define STBI_NO_TGA
#define STBI_NO_GIF
#define STBI_NO_HDR
#define STBI_NO_PIC
#define STBI_NO_PNM
#define STBI_NO_LINEAR
#define STB_IMAGE_IMPLEMENTATION
#include "stb/stb_image.h"

namespace dopple {
	SDLWindow *platformWindow = nullptr;
}

void Image::load()
{
	unsigned char *data = 
		stbi_load(this->src + dopple::STR_HEADER_SIZE, &this->x, &this->y, &this->comp, 0);

	if(data == nullptr) {
		printf("Error: Could not load image from path: %s\n", this->src + dopple::STR_HEADER_SIZE);
		return;
	}

	this->loaded = 1;
	stbi_image_free(data);

	if(this->onload) {
		this->onload();
	}
}

WebGLRenderingContext::WebGLRenderingContext(CanvasElement *parent)
: parent(parent)
{
	this->logBuffer = new char[this->logBufferSize];
	memset(this->logBuffer, '\0', this->logBufferSize);
	
	dopple::platformWindow = new dopple::SDLWindow(parent->width, parent->height);
}

Window *window = new Window();
Document *document = window->document;