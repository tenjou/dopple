#pragma once

#include "dopple_core.h"
#include "dopple_sdl.h"

namespace dopple
{
	extern SDLWindow *platformWindow;
	
	void destroy()
	{
		if(platformWindow) {
			platformWindow->start();
		}
	}
}

struct Image
{
	void load();

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

struct CanvasElement;

struct WebGLRenderingContext
{
	WebGLRenderingContext(CanvasElement *parent);
	
	// void viewport(double x, double y, double width, double height) {
	// 	glViewport(x, y, width, height);
	// }
	
	// void clear(GLbitfield mask) {
	// 	glClear(mask);
	// }
	
	// void clearColor(GLfloat red, GLfloat green, GLfloat blue, GLfloat alpha) {
	// 	glClearColor(red, green, blue, alpha);
	// }
	
	// WebGLShader *createShader(double type) {
	// 	return new WebGLShader(type);
	// }
	
	// void shaderSource(WebGLShader *shader, char *src)
	// {
	// 	char *tmp = src + dopple::STR_HEADER_SIZE;
	// 	const char *cmp = "precision mediump float; ";
	// 	int8 num = strlen(cmp);
	// 	if(strncmp(tmp, cmp, num) == 0) {
	// 		tmp += num;
	// 	}
	
	// 	glShaderSource(shader->shaderID, 1, &tmp, nullptr);
	// }
	
	// void compileShader(WebGLShader *shader) {
	// 	glCompileShader(shader->shaderID);
	// }
	
	// WebGLProgram *createProgram() {
	// 	return new WebGLProgram();
	// }
	
	// void attachShader(WebGLProgram *program, WebGLShader *shader) {
	// 	glAttachShader(program->programID, shader->shaderID);
	// }
	
	// void linkProgram(WebGLProgram *program) {
	// 	glLinkProgram(program->programID);
	// }
	
	// void useProgram(WebGLProgram *program) {
	// 	glUseProgram(program->programID);
	// }
	
	// bool getShaderParameter(WebGLShader *shader, GLenum type)
	// {
	// 	glGetShaderiv(shader->shaderID, GL_INFO_LOG_LENGTH, &this->logLength);
	
	// 	if(this->logLength > 0) {
	// 		return false;
	// 	}
	
	// 	return true;
	// }
	
	// bool getProgramParameter(WebGLProgram *program, GLenum type)
	// {
	// 	glGetProgramiv(program->programID, GL_INFO_LOG_LENGTH, &this->logLength);
	
	// 	if(this->logLength > 0) {
	// 		return false;
	// 	}
	
	// 	return true;
	// }
	
	// WebGLUniformLocation *getUniformLocation(WebGLProgram *program, char *name) {
	// 	return new WebGLUniformLocation(program, name + dopple::STR_HEADER_SIZE);
	// }
	
	// void uniform4fv(WebGLUniformLocation *uniform, Float32Array &buffer) {
	// 	glUniform4fv(uniform->location, 1, buffer.buffer);
	// }
	
	// GLuint getAttribLocation(WebGLProgram *program, char *name) {
	// 	return glGetAttribLocation(program->programID, name + dopple::STR_HEADER_SIZE);
	// }
	
	// const char *getShaderInfoLog(WebGLShader *shader)
	// {
	// 	if(this->logLength > this->logBufferSize - dopple::STR_HEADER_SIZE) {
	// 		this->logBufferSize = this->logLength + dopple::STR_HEADER_SIZE;
	// 		delete [] this->logBuffer;
	// 		this->logBuffer = new char[this->logBufferSize];
	// 		memset(this->logBuffer, '\0', this->logBufferSize);
	// 	}
	
	// 	glGetShaderInfoLog(shader->shaderID, this->logLength, nullptr, this->logBuffer + dopple::STR_HEADER_SIZE);
	// 	return this->logBuffer;
	// }
	
	// const char *getProgramInfoLog(WebGLProgram *program)
	// {
	// 	if(this->logLength > this->logBufferSize - dopple::STR_HEADER_SIZE) {
	// 		this->logBufferSize = this->logLength + dopple::STR_HEADER_SIZE;
	// 		delete [] this->logBuffer;
	// 		this->logBuffer = new char[this->logBufferSize];
	// 		memset(this->logBuffer, '\0', this->logBufferSize);
	// 	}
	
	// 	glGetProgramInfoLog(program->programID, this->logLength, nullptr, this->logBuffer + dopple::STR_HEADER_SIZE);
	// 	return this->logBuffer;
	// }
	
	// WebGLBuffer *createBuffer() {
	// 	return new WebGLBuffer();
	// }
	
	// void bindBuffer(GLenum type, WebGLBuffer *buffer) {
	// 	glBindBuffer(type, buffer->bufferID);
	// }
	
	// void bufferData(GLenum type, Float32Array &array, GLenum usage) {
	// 	glBufferData(type, array.size * sizeof(float), array.buffer, usage);
	// }
	
	// void enableVertexAttribArray(GLuint index) {
	// 	glEnableVertexAttribArray(index);
	// }
	
	// void vertexAttribPointer(GLuint index, GLint size, GLenum type,
	// 						 GLboolean normalized, GLsizei stride, const GLvoid* pointer)
	// {
	// 	glVertexAttribPointer(index, size, type, normalized, stride, pointer);
	// }
	
	// void drawArrays(GLenum mode, GLint first, GLsizei count) {
	// 	glDrawArrays(mode, first, count);
	// }
	
	//
	CanvasElement *parent = nullptr;
	
	int logLength = 0;
	int logBufferSize = 128;
	char *logBuffer = nullptr;
};

struct CanvasElement: public Element
{
	CanvasElement() {}
	
	WebGLRenderingContext *getContext(const char *str)
	{
		if(!this->ctx) {
			this->ctx = new WebGLRenderingContext(this);
		}
		return this->ctx;
	}

	void __setter__width(real64 width) {
		this->width = width;
	}

	real64 __getter__width() { 
		return this->width;
	}

	void __setter__height(real64 height) {
		this->height = height;
	}

	real64 __getter__height() {
		return this->height;
	}
	
	//
	WebGLRenderingContext *ctx = nullptr;
	real64 width = 300;
	real64 height = 150;
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
	
	void requestAnimationFrame(void (*cb)())
	{
		if(dopple::platformWindow) {
			dopple::platformWindow->requestAnimFrame = cb;
		}
	}
	
	//
	Document *document = nullptr;
};

extern Window *window;
extern Document *document;
