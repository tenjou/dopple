#include <stdio.h>
#include <stdarg.h>
#include <stdint.h>

void console$log(const char *format, ...)
{
    va_list argptr;
    va_start(argptr, format);
    vfprintf(stderr, format, argptr);
    va_end(argptr);
}

void alert(const char *str)
{
	printf("ALERT: %s\n", str);
}

void confirm(const char *str)
{
	printf("CONFIRM: %s\n", str);
}