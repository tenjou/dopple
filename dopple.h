#include <stdio.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdlib.h>

typedef struct Array {

} Array;

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