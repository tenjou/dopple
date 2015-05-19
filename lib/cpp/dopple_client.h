#pragma once

#include "dopple_sdl.h"
#include "dopple_defs.h"

struct WebGLShader
{
	WebGLShader(GLuint type) {
		this->shaderID = glCreateShader(type);
	}
	
	GLuint shaderID = 0;
};

struct WebGLProgram
{
	WebGLProgram() {
		this->programID = glCreateProgram();
	}
	
	GLuint programID = 0;
};

struct WebGLUniformLocation
{
	WebGLUniformLocation(WebGLProgram *program, char *name) {
		this->location = glGetUniformLocation(program->programID, name);
	}
	
	GLint location;
};

struct WebGLBuffer
{
	WebGLBuffer() {
		glGenBuffers(1, &this->bufferID);
	}
	
	GLuint bufferID;
};

struct Element {
	
};



struct CanvasElement;

struct Float32Array
{
	Float32Array() {}
	
	Float32Array(float *buffer, int32_t size) {
		this->buffer = buffer;
		this->size = size;
	}
	
	//
	float *buffer = 0;
	int32_t size = 0;
};

struct WebGLRenderingContext
{
	WebGLRenderingContext(CanvasElement *parent);
	
	void viewport(double x, double y, double width, double height) {
		glViewport(x, y, width, height);
	}
	
	void clear(GLbitfield mask) {
		glClear(mask);
	}
	
	void clearColor(GLfloat red, GLfloat green, GLfloat blue, GLfloat alpha) {
		glClearColor(red, green, blue, alpha);
	}
	
	WebGLShader *createShader(double type) {
		return new WebGLShader(type);
	}
	
	void shaderSource(WebGLShader *shader, char *src)
	{
		char *tmp = src + dopple::STR_HEADER_SIZE;
		const char *cmp = "precision mediump float; ";
		int8 num = strlen(cmp);
		if(strncmp(tmp, cmp, num) == 0) {
			tmp += num;
		}

		glShaderSource(shader->shaderID, 1, &tmp, nullptr);
	}
	
	void compileShader(WebGLShader *shader) {
		glCompileShader(shader->shaderID);
	}
	
	WebGLProgram *createProgram() {
		return new WebGLProgram();
	}
	
	void attachShader(WebGLProgram *program, WebGLShader *shader) {
		glAttachShader(program->programID, shader->shaderID);
	}
	
	void linkProgram(WebGLProgram *program) {
		glLinkProgram(program->programID);
	}
	
	void useProgram(WebGLProgram *program) {
		glUseProgram(program->programID);
	}
	
	bool getShaderParameter(WebGLShader *shader, GLenum type)
	{
		glGetShaderiv(shader->shaderID, GL_INFO_LOG_LENGTH, &this->logLength);
		
		if(this->logLength > 0) {
			return false;
		}
		
		return true;
	}
	
	bool getProgramParameter(WebGLProgram *program, GLenum type)
	{
		glGetProgramiv(program->programID, GL_INFO_LOG_LENGTH, &this->logLength);
		
		if(this->logLength > 0) {
			return false;
		}
		
		return true;
	}
	
	WebGLUniformLocation *getUniformLocation(WebGLProgram *program, char *name) {
		return new WebGLUniformLocation(program, name + dopple::STR_HEADER_SIZE);
	}
	
	void uniform4fv(WebGLUniformLocation *uniform, Float32Array &buffer) {
		glUniform4fv(uniform->location, 1, buffer.buffer);
	}
	
	GLuint getAttribLocation(WebGLProgram *program, char *name) {
		return glGetAttribLocation(program->programID, name + dopple::STR_HEADER_SIZE);
	}
	
	const char *getShaderInfoLog(WebGLShader *shader)
	{
		if(this->logLength > this->logBufferSize - dopple::STR_HEADER_SIZE) {
			this->logBufferSize = this->logLength + dopple::STR_HEADER_SIZE;
			delete [] this->logBuffer;
			this->logBuffer = new char[this->logBufferSize];
			memset(this->logBuffer, '\0', this->logBufferSize);
		}
		
		glGetShaderInfoLog(shader->shaderID, this->logLength, nullptr, this->logBuffer + dopple::STR_HEADER_SIZE);
		return this->logBuffer;
	}
	
	const char *getProgramInfoLog(WebGLProgram *program)
	{
		if(this->logLength > this->logBufferSize - dopple::STR_HEADER_SIZE) {
			this->logBufferSize = this->logLength + dopple::STR_HEADER_SIZE;
			delete [] this->logBuffer;
			this->logBuffer = new char[this->logBufferSize];
			memset(this->logBuffer, '\0', this->logBufferSize);
		}
		
		glGetProgramInfoLog(program->programID, this->logLength, nullptr, this->logBuffer + dopple::STR_HEADER_SIZE);
		return this->logBuffer;
	}
	
	WebGLBuffer *createBuffer() {
		return new WebGLBuffer();
	}
	
	void bindBuffer(GLenum type, WebGLBuffer *buffer) {
		glBindBuffer(type, buffer->bufferID);
	}
	
	void bufferData(GLenum type, Float32Array &array, GLenum usage) {
		glBufferData(type, array.size * sizeof(float), array.buffer, usage);
	}
	
	void enableVertexAttribArray(GLuint index) {
		glEnableVertexAttribArray(index);
	}
	
	void vertexAttribPointer(GLuint index, GLint size, GLenum type,
							 GLboolean normalized, GLsizei stride, const GLvoid* pointer)
	{
		glVertexAttribPointer(index, size, type, normalized, stride, pointer);
	}
	
	void drawArrays(GLenum mode, GLint first, GLsizei count) {
		glDrawArrays(mode, first, count);
	}
	
	//
	CanvasElement *parent = nullptr;
	
	GLuint DEPTH_BUFFER_BIT = 0x00000100;
	GLuint STENCIL_BUFFER_BIT = 0x00000400;
	GLuint COLOR_BUFFER_BIT = 0x00004000;
	GLuint VERTEX_SHADER = 0x8B31;
	GLuint FRAGMENT_SHADER = 0x8B30;
	GLuint COMPILE_STATUS = 0x8B81;
	GLuint LINK_STATUS = 0x8B82;
	GLuint ARRAY_BUFFER = 0x8892;
	GLuint STATIC_DRAW = 0x88E4;
	GLuint FLOAT = 0x1406;
	GLuint TRIANGLES = 0x0004;
	
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
	
	//
	WebGLRenderingContext *ctx = nullptr;
	double width = 300;
	double height = 150;
};

struct Document
{
	Document() {
		this->mainCanvas = new CanvasElement();
	}
	
	CanvasElement *getElementById(const char *strID) {
		return this->mainCanvas;
	}
	
	//
	CanvasElement *mainCanvas = nullptr;
};

extern dopple::SDLWindow *sdl_wnd;

struct Window
{
	Window() {
		this->document = new Document();
	}
	
	void requestAnimationFrame(void (*cb)()) {
		sdl_wnd->cb = cb;
	}
	
	//
	Document *document = nullptr;
};


extern Window *window;
extern Document *document;



inline void __dopple__create() {
	srand(time(nullptr));
}

inline void __dopple__destroy() {
	sdl_wnd->start();
}
