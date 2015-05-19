#pragma once

#include "dopple_sdl.h"
#include "stb/stb_image.h"

struct Image
{
	void load()
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

	inline void __setter__src(char *src) {
		this->src = src;
		this->load();
	}

	inline char *__getter__src() {
		return this->src;
	}

	//
	int x, y, comp;
	char *src = nullptr;
	int8 loaded = 0;
	void (*onload)() = nullptr;
};

struct Element {};

// struct WebGLRenderingContext;

struct CanvasElement: public Element
{
	CanvasElement() {}
	
	// WebGLRenderingContext *getContext(const char *str)
	// {
	// 	if(!this->ctx) {
	// 		this->ctx = new WebGLRenderingContext(this);
	// 	}
	// 	return this->ctx;
	// }
	
	//
	//WebGLRenderingContext *ctx = nullptr;
	double width = 300;
	double height = 150;
};

struct Document
{
	Document() {
		this->screenCanvas = new CanvasElement();
	}
	
	CanvasElement *getElementById(const char *strID) {
		return this->screenCanvas;
	}
	
	//
	CanvasElement *screenCanvas = nullptr;
};

struct Window
{
	Window() {
		this->document = new Document();
	}
	
	void requestAnimationFrame(void (*cb)()) {
		//sdl_wnd->cb = cb;
	}
	
	//
	Document *document = nullptr;
};

// struct WebGLShader
// {
// 	WebGLShader(GLuint type) {
// 		this->shaderID = glCreateShader(type);
// 	}
	
// 	GLuint shaderID = 0;
// };

// struct WebGLProgram
// {
// 	WebGLProgram() {
// 		this->programID = glCreateProgram();
// 	}
	
// 	GLuint programID = 0;
// };

// struct WebGLUniformLocation
// {
// 	WebGLUniformLocation(WebGLProgram *program, char *name) {
// 		this->location = glGetUniformLocation(program->programID, name);
// 	}
	
// 	GLint location;
// };

// struct WebGLBuffer
// {
// 	WebGLBuffer() {
// 		glGenBuffers(1, &this->bufferID);
// 	}
	
// 	GLuint bufferID;
// };

