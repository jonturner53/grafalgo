SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../../include
LDIR := ../../../lib
BIN := ~/bin
WARN := -Wall
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

XFILES = testGcolor evalGcolor

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${XFILES}

testGcolor: testGcolor.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

evalGcolor: evalGcolor.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

foo: foo.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
