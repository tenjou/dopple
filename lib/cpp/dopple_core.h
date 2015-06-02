#pragma once

#include <stdio.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdlib.h>
#include <math.h>
#include <float.h>
#include <string.h>
#include <time.h>

typedef int8_t int8;
typedef int16_t int16;
typedef int32_t int32;
typedef uint8_t	uint8;
typedef uint16_t uint16;
typedef uint32_t uint32;
typedef float real32;
typedef double real64;

namespace dopple
{
	const int32 STR_HEADER_SIZE = 4;

	inline void create() {
		srand((uint32_t)time(nullptr));
	}

	inline void destroy();
}

struct
{
	void log(const char *format, ...)
	{
		va_list argptr;
		va_start(argptr, format);
		vfprintf(stderr, format, argptr);
		va_end(argptr);
	}
	
	void warn(const char *format, ...)
	{
		va_list argptr;
		va_start(argptr, format);
		vfprintf(stderr, format, argptr);
		va_end(argptr);
	}
	
	void error(const char *format, ...)
	{
		va_list argptr;
		va_start(argptr, format);
		vfprintf(stderr, format, argptr);
		va_end(argptr);
	}
} console;

struct
{
	double abs(double num) {
		return ::abs((int)num);
	}
	
	double random() {
		return ((double)rand() / (RAND_MAX));
	}
	
	double sin(double num) {
		return ::sin(num);
	}
	
	double cos(double num) {
		return ::cos(num);
	}
	
	double PI = 3.141592653589793;
} Math;

template <class T>
struct Array 
{
	Array(int32 length = 0) {}
	
	Array(T *buffer, int32 length) {
		this->buffer = buffer;
		this->length = length;
	}
	
	Array(T buffer) {
		this->buffer = buffer.buffer;
		this->length = buffer.length;
	}

	~Array() 
	{
		if(this->capacity > 0) {
			delete [] this->buffer;
		}
	}
	
	int32 push(T *element) {
		return this->length;
	}
	
	T pop() 
	{
		T *element = this->buffer[this->length - 1];
		this->buffer[this->length] = nullptr;

		return (*element);
	}
	
	T shift() {
		return nullptr;
	}
	
	inline void __set__length(int32 length)
	{
		if(length > this->capacity) 
		{
			if(this->capacity > 0) {
				delete [] this->buffer;
			}

			this->buffer = new T[length];
			this->capacity = length;
		}

		this->length = length;
	}
	
	inline int32 __get__length(real64) { 
		return this->length; 
	}
	
	T operator [](int32 index)
	{
		if(index >= this->length) {
			return 0;
		}
		if(index < 0) {
			return 0;
		}
		
		return this->buffer[index];
	}
	
	//
	T *buffer = nullptr;
	int32 capacity = 0;
	int32 length = 0;
};

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
