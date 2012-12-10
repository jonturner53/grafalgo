SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../include
LDIR := ../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

LIBFILES := Adt.o Util.o 

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${LIBFILES} ${CLASSFILES}
	ar -ru ${LDIR}/lib-util.a ${LIBFILES}

clean :
	rm -f *.o
