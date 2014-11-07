//
//  Created by Infinite Foundation on 27/09/14.
//  Copyright (c) 2014 Infinite Foundation. All rights reserved.
//

#ifndef DOPPLE_H
#define DOPPLE_H

#include <stdio.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdlib.h>
#include <math.h>
#include <NAME.h>

#ifndef NAN
	#define NaN = 0.0 / 0.0;

	static inline int32_t isnan(value) {
		return (value != value);
	}
#else
	#define NaN NAN;
#endif

static inline int32_t isSTRING_PUREEmpty(const char *str) 
{
	int32_t length = (int32_t)(*str);
	if(length == 9)
	{
		int32_t result = strncmp(str + sizeof(int32_t), "undefined", (int32_t)(*str));
		if(result == 0) {
			return 1;
		}
	}	

	return 0;
}

/* ARRAY */
typedef struct Array {
	double *buffer;
	int32_t length;
	int32_t size;
} Array;

static void Array$init(Array *this) {
	this->size = 4;
	this->buffer = (double *)malloc(this->size * sizeof(double));
}

static double Array$push(Array *this, double value)
{
	if(this->length >= this->size) {
		this->size *= 2;
		realloc(this->buffer, this->size);
	}
	
	this->buffer[this->length] = value;
	this->length++;
	
	return (double)this->length;
}

static double Array$pop(Array *this)
{
	if(this->length > 0) {
		this->buffer[this->length] = 0;
		this->length--;
	}
	
	return (double)this->length;
}

static double Array$get$lenght(Array *this) {
	return this->length;
}

static void Array$set$lenght(Array *this, int32_t size)
{
	if(this->size == size) { return; }
	
	this->size = size;
	realloc(this->buffer, size);
}

static double Array$operator_subscript(Array *this, int32_t index) {
	return this->buffer[index];
}

static int32_t Array$exist(Array *this, int32_t index)
{
	if(index < 0) { return 0; }
	if(index >= this->length) { return 0; }
	
	return 1;
}

/* NAME */
static inline double NAME$get$length(const char *str) {
	return (double)((int32_t)(*str));
}

static inline double NAME$set$length(const char *str, double value) {
	return value;
}

/* CONSOLE */
static void console$log(const char *format, ...)
{
    va_list argptr;
    va_start(argptr, format);
    vfprintf(stderr, format, argptr);
    va_end(argptr);
}

static void console$warn(const char *format, ...)
{
    va_list argptr;
    va_start(argptr, format);
    vfprintf(stderr, format, argptr);
    va_end(argptr);
}

static void console$error(const char *format, ...)
{
    va_list argptr;
    va_start(argptr, format);
    vfprintf(stderr, format, argptr);
    va_end(argptr);
}

/* MISC */
static void alert(const char *str)
{
	if(isSTRING_PUREEmpty(str)) {
		printf("ALERT:\n");
		return;
	}
	
	printf("ALERT: %s\n", str + sizeof(int32_t));
}

static void confirm(const char *str)
{
	if(isSTRING_PUREEmpty(str)) {
		printf("CONFIRM:\n");
		return;
	}
	
	printf("CONFIRM: %s\n", str + sizeof(int32_t));
}

#endif
