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

#ifndef NAN
	#define NaN = 0.0 / 0.0;

	static inline int32_t isnan(value) {
		return (value != value);
	}
#else
	#define NaN NAN;
#endif

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

/* STRING */
static inline double String$length(const char *str) {
	return (double)((int32_t)(*str));
}

static void console$log(const char *format, ...)
{
    va_list argptr;
    va_start(argptr, format);
    vfprintf(stderr, format, argptr);
    va_end(argptr);
}

static void alert(const char *str)
{
	printf("ALERT: %s\n", str);
}

static void confirm(const char *str)
{
	printf("CONFIRM: %s\n", str);
}

#endif
