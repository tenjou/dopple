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
#include <float.h>
#include <string.h>

typedef int32_t NUMBER;
const NUMBER NUMBER_SIZE = sizeof(NUMBER);

const NUMBER maxDoubleDigits = DBL_MANT_DIG - DBL_MIN_EXP + 3;

NUMBER __dopple_strOffset = NUMBER_SIZE;
NUMBER __dopple_strLength = 0;
double __dopple_tmp = 0;
char __dopple_digits[maxDoubleDigits];

#define STR_MALLOC(var) var = malloc(__dopple_strLength + NUMBER_SIZE);
#define STR_APPEND_LENGTH(str, length) str[0] = length; str[1] = length >> 8; str[2] = length >> 16; str[3] = length >> 24;
#define STR_APPEND_MEMCPY(target, source) memcpy(target + __dopple_strOffset, source + NUMBER_SIZE, (*(NUMBER *)source));
#define STR_INC_NUM_OFFSET(num) __dopple_strOffset += num;
#define STR_INC_STR_OFFSET(ptr) __dopple_strOffset += (*(NUMBER *)ptr);

#ifndef NAN
	#define NAN 0.0 / 0.0;

	static inline int32_t isnan(value) {
		return (value != value);
	}
#endif

const double NaN = NAN;

static inline int32_t isStringEmpty(const char *str)
{
	int32_t length = (int32_t)str;
	if(length == 9)
	{
		int32_t result = strncmp(str + sizeof(int32_t), "undefined", *(int32_t*)str);
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

/* STRING */
static inline double String$length(const char *str) {
	return (double)(*(int32_t*)str);
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
	if(isStringEmpty(str)) {
		printf("ALERT:\n");
		return;
	}
	
	printf("ALERT: %s\n", str + sizeof(int32_t));
}

static void confirm(const char *str)
{
	if(isStringEmpty(str)) {
		printf("CONFIRM:\n");
		return;
	}
	
	printf("CONFIRM: %s\n", str + sizeof(int32_t));
}

#endif
