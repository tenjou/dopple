#pragma once

#include "dopple_client.h"

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
struct Array {
	Array() {
		
	}
	
	Array(T *buffer) {
		this->buffer= buffer;
	}
	
	double push(T *element) {
		return this->length;
	}
	
	T *pop() {
		return nullptr;
	}
	
	T *shift() {
		return nullptr;
	}
	
	void __set__length(double length) {
		
	}
	
	inline void __get__length(double) { return this->length; }
	
	
	
	T *buffer = nullptr;
};
