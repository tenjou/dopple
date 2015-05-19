#include "dopple_client.h"

WebGLRenderingContext::WebGLRenderingContext(CanvasElement *parent)
: parent(parent)
{
	this->logBuffer = new char[this->logBufferSize];
	memset(this->logBuffer, '\0', this->logBufferSize);
	
	//sdl_wnd = new dopple::SDLWindow(parent->width, parent->height);
	//dopple::window->start();
}

Window *window = new Window();
Document *document = window->document;

dopple::SDLWindow *sdl_wnd = nullptr;

#define STB_IMAGE_IMPLEMENTATION
#include "/Volumes/Workspace/www/meta/dopple/lib/cpp/stb/stb_image.h"